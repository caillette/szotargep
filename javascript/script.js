// =======================
// Constants for everybody
// =======================

var UNDEFINED = "undefined" ;
var CHECKED = "checked" ;
var UNCHECKED = "unchecked" ;
var UNAVAILABLE = "unavailable" ;

var EQUIVALENCES = "EQUIVALENCES" ;


// =======
// Parsing
// =======

// Equivalence: a pair of Terms.
// Term: what's in a non-indented line.
// Definition: the indented lines relative to a Term.


var characters = "'~,;!\\?\\-\\(\\)/\\\\\"\\wáéíóúÁÉÚÍÓÚőűŐŰöüÜÖœàâèêëïîôûçŒÀÂÈÊËÏÎÔÛÇ" ;
var textExp = "(?:[" + characters + "][ " + characters + "]*)" ;
var termExp = textExp ;
var definitionLineExp = "(?: +" + textExp + ")" ;
var definitionLineCapturingExp = "(?: +(" + textExp + "))" ;


function parseEquivalences( themeKey, text ) {
  // http://regexpal.com
  // http://regexpal.com/?flags=m&regex=%5Cn(%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn(%3F%3A(%3F%3A%20%2B%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn)*(%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn(%3F%3A(%3F%3A%20%2B%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn)*&input=%0AFo%0AB%20ar%0A%0AWhat%0A%20ever%0A%0AFoo%0ABar%0A%20Foo%0ABar%0A%0AFoo%0A%20Bar%0AFoo%0A%20Bar%0A%0AFoo%0A%20%20Bar%0A%20%20Bar%0AFoo%20%0A%20%20Bar%0A%0AFoo%0A%20%20Bar%0AFoo%0A%20%20%0A%0A
  var equivalenceExp = new RegExp(
        "\n"
      + "(" + termExp + ")\n((?:" + definitionLineExp + "\n)*)"
      + "(" + termExp + ")\n((?:" + definitionLineExp + "\n)*)"
      ,"g"
  ) ;

  var array = [] ;
  while( true ) {
    var match = equivalenceExp.exec( text ) ;
    if( ! match ) break ;
    var array1 = splitDefinitionLines( match[ 1 ], match[ 2 ] ) ;
    var array2 = splitDefinitionLines( match[ 3 ], match[ 4 ] ) ;
    array.push( { THEME_KEY : themeKey, LANGUAGE_1 : array1, LANGUAGE_2 : array2 } ) ;
  }
  return array ;
}


function splitDefinitionLines( term, definitionLines ) {
  var lineExp = new RegExp( "" + definitionLineCapturingExp + "\n" ,"g" ) ;
  var array = [ term ] ;

  while( true ) {
    var match = lineExp.exec( definitionLines ) ;
    if( ! match ) break ;
    array.push( match[ 1 ] ) ;
  }
  return array ;

}

// ==========
// Page setup
// ==========

function showMessage( message ) {
  if( $( "#console" ).is( ":visible" ) ) {
    $( "p#messages" ).append( "<pre>" + message.toString() + "</pre>" ) ;
  }
}



// All declared themes.
// It's an array of of associative arrays where each element represents a theme.
// Don't use for( i in THEMES ), use for( i in THEMES.keys() ).
var THEMES = [] ;

function environmentSetup() {

  THEMES.byKey = function( key ) {
    for( index in this ) {
      var theme = this[ index ] ;
      if( theme.key == key ) {
        return theme ;
      }
    }
    return null ;
  } ;

  THEMES.keys = function( key ) {
    var result = [] ;
    for( i = 0 ; i < this.length ; i ++ ) result.push( i ) ;
    return result ;
  } ;

  // http://stackoverflow.com/questions/330331/jquery-get-charset-of-reply-when-no-header-is-set
  $.ajaxSetup( {
    "beforeSend" : function( xhr ) {
      xhr.overrideMimeType( "text/html; charset=UTF-8" ) ;
    }
  } ) ;

  shortcut.add( "return",function() {
    if( ! LISTING_EQUIVALENCES ) disclose() ;
  } ) ;

}

function initializeThemes() {

  $( "#themes > dt" ).each( function() {
    var themeKey = $( this ).text() ;
    THEMES.push( { key : themeKey, status : UNDEFINED } ) ;
  } ) ;

  showMessage( "Loading themes..." ) ;
  for( index in THEMES.keys() ) {
    var theme = THEMES[ index ] ;
    loadTheme( theme.key ) ;
  }
}

// Seems that we need to make this variable global, for visibility reasons.
var completionCount = 0 ;


// Loads a theme, with various side effects on the DOM for the checkboxes and on the THEMES array.
function loadTheme( themeKey ) {
  showMessage( "Loading '" + themeKey + "'..." ) ;
  var theme = THEMES.byKey( themeKey ) ;
  var keyCount = THEMES.keys().length ;
  completionCount = 0 ;

  $.get( themeKey, function( payload ) {
    var equivalences = parseEquivalences( themeKey, payload ) ;

    theme.equivalences = equivalences ;
    theme.status = UNCHECKED ;
    var id = "checkbox-" + themeKey ;
    $( "#theme-choice" ).append(
        "<p>"
        + "<input "
            + "type = 'checkbox' "
            + "name = '" + themeKey + "' "
            + "id = '" + id + "' "
            + "onclick ='onThemeChecked() ;' "
        + ">"
        + "<label for='" + id + "' >" + themeKey + "</label>"
    ) ;

    showMessage( "Loaded " + equivalences.length + " equivalences for " + themeKey + "." ) ;

  } ).error( function() {
    theme.status = UNAVAILABLE ;
    $( "#theme-choice" ).append(
        "<p>"
        + "<input "
            + "type ='checkbox' "
            + "name ='theme-" + themeKey + "' "
            + "disabled ='disabled' "
        + ">"
        + "<span style = 'text-decoration : line-through ;' >" + themeKey + "</span>"
    ) ;
    showMessage( "Unavailable: '" + themeKey + "'." ) ;
  } ).complete( function() {
    completionCount ++ ;
    if( completionCount == keyCount ) {
      showMessage( "Loaded " + completionCount + " theme(s)." ) ;
      selectAllThemes( true ) ;
    }
  } ) ;

}



// ===============================
// Theme and equivalence selection
// ===============================

// All Equivalences to chose into. Same structure as a THEMES element.
var EQUIVALENCES = [] ;

// Reminds last Equivalence showed for not showing twice the same in a row.
var LAST_EQUIVALENCE = null ;

// Inverts the natural order (the one in theme files).
var INVERT_LANGUAGES = true ;

// We recalculate everything each time since it's just feeding an array.
function onThemeChecked() {
  DISCLOSURE = 0 ;
  EQUIVALENCES = [] ;
  $( "#theme-choice :checked" ).each( function() {
    var checkboxName = $( this ).attr( "name" ) ;
    var theme = THEMES.byKey( checkboxName ) ;
    for( equivalenceIndex in theme.equivalences ) {
      var equivalence = theme.equivalences[ equivalenceIndex ] ;
      EQUIVALENCES.push( equivalence ) ;
    }
  } ) ;
  showMessage( "Selected " + EQUIVALENCES.length + " equivalence(s)." ) ;
  if( LISTING_EQUIVALENCES ) {
    justPrintEquivalences() ;
  } else {
    showSomeEquivalence() ;
  }
  enableToolbarElements() ;
}


// Tells if we entered the list-style kind of display.
var LISTING_EQUIVALENCES = false ;

function togglePrintEquivalences() {
  LISTING_EQUIVALENCES = ! LISTING_EQUIVALENCES ;
  if( LISTING_EQUIVALENCES ) {
    justPrintEquivalences() ;
  } else {
    DISCLOSURE = 0 ;
    showSomeEquivalence() ;
  }
  enableToolbarElements() ;
}

function justPrintEquivalences() {
  if( EQUIVALENCES.length == 0 ) {
    clearBoard() ;
  } else {
    var html = "" ;
    html += "<p class='total' >Végösszeg: " + EQUIVALENCES.length + "</p>" ;
    for( themeIndex in EQUIVALENCES ) {
      var equivalence = EQUIVALENCES[ themeIndex ] ;
      html += "<table class='equivalence-list' ><tbody>\n" ;
      html = printEquivalence( html, equivalence, false ) ;
      html += "</tbody></table>" ;

      // Help the Web browser to keep tables together.
      html += "<p class='void' ></p>\n" ;
    }
    $( "#board" ).html( html ) ;
    $( "#theme-key" ).html( "" ) ;
  }
}

function showSomeEquivalence() {

  // We shouldn't get into that function if the following is true, except with a keyboard shortcut.
  if( LISTING_EQUIVALENCES ) return ;

  if( EQUIVALENCES.length == 0 ) {
    clearBoard() ;
  } else {
    do {
      var random = Math.floor( Math.random() * EQUIVALENCES.length ) ;
      var newEquivalence = EQUIVALENCES[ random ] ;
    } while( newEquivalence == LAST_EQUIVALENCE ) ;
    LAST_EQUIVALENCE = newEquivalence ;
    showEquivalence( newEquivalence ) ;
  }
}

function printEquivalence( html, equivalence, mayHide ) {
  var max = Math.max( equivalence.LANGUAGE_1.length, equivalence.LANGUAGE_2.length ) ;

  function appendLanguage( html, language, index, visible ) {
    if( index < language.length ) {
      return html
          // Using a span to make the cell's content truly invisible.
          // Making the cell content invisible causes other decoractions to not show.
          + "<td" + ( visible ? "" : " class = 'undisclosed' " ) + "><span>"
          + language[ index ]
          + "</span></td>" ;
    } else {
      return html + "<td></td>" ;
    }
  } ;

  for( i = 0 ; i < max ; i ++ ) {
    html += "<tr>" ;
    if( INVERT_LANGUAGES ) {
      html = appendLanguage( html, equivalence.LANGUAGE_2, i, true ) ;
      html = appendLanguage( html, equivalence.LANGUAGE_1, i, ! mayHide ) ;
    } else {
      html = appendLanguage( html, equivalence.LANGUAGE_1, i, true ) ;
      html = appendLanguage( html, equivalence.LANGUAGE_2, i, ! mayHide ) ;
    }
    html += "</tr>\n" ;
  }
  return html ;
}


function showEquivalence( equivalence ) {
  var html = "<table><tbody>\n" ;
  html = printEquivalence( html, equivalence, true ) ;

  html += "</tbody></table>\n" ;
  $( "#board" ).html( html ) ;
  $( "#theme-key" ).html( "<p>" + equivalence.THEME_KEY + "</p>" ) ;
}

function selectAllThemes( enabled ) {
  // Filter as a workaround.
  $( "#theme-choice :checkbox" ).filter( ":enabled" ).attr( "checked", enabled ) ;
  onThemeChecked() ;
}


function clearBoard() {
  $( "#board" ).html( "<p class='no-theme' >Nincs kiválasztás</p>" ) ;
  $( "#theme-key" ).html( "<p></p>" ) ;
  LAST_EQUIVALENCE = null ;
}


// ==========
// Disclosure
// ==========

var DISCLOSURE = 0 ;

function disclose() {
  var max = INVERT_LANGUAGES
      ? LAST_EQUIVALENCE.LANGUAGE_1.length : LAST_EQUIVALENCE.LANGUAGE_2.length ;
  if( DISCLOSURE >= max ) {
    DISCLOSURE = 0 ;
    showSomeEquivalence() ;
  } else {
    // The :eq(n) pseudo-selector doesn't work as expected. 
    $( "#board > table > tbody > tr" ).eq( DISCLOSURE ).contents()
        .filter( "td" ).eq( 1 ) .removeClass( "undisclosed" ) ;
    DISCLOSURE ++ ;
  }
}


// ==================
// Toolbar's commands
// ==================

function initializeToolbar() {
  $( "#toolbar" )
      .append(
          "<button "
              + "type = 'button' "
              + "disabled = 'disabled' "
              + "name = 'select-all-themes' "
              + "class ='widget' "
              + "onClick ='selectAllThemes( true ) ;' "
          + ">Minden</button>"
      ).append(
          "<button "
              + "type = 'button' "
              + "disabled = 'disabled' "
              + "name = 'select-no-theme' "
              + "class ='widget' "
              + "onClick ='selectAllThemes( false ) ;' "
          + ">Semmi</button>"
      ).append(
          "<button "
              + "type = 'button' "
              + "disabled = 'disabled' "
              + "name = 'disclose' "
              + "id = 'disclose' "
              + "onClick ='disclose() ;' "
              + "class ='widget' "
          + ">Felfel</button>"
      ).append(
        "<input "
            + "type = 'checkbox' "
            + "disabled = 'disabled' "
            + "id = 'print-equivalences' "
            + "onclick ='togglePrintEquivalences() ;' "
            + "class ='widget' "
        + ">"
        + "<label for='print-equivalences' >Lista</label>"
      )
  ;


}

function enableToolbarElements() {

  function setEnabled( element, enabled ) {
    if( enabled ) {
      element.removeAttr( "disabled" ) ;
    } else {
      element.attr( "disabled", "disabled" ) ;
    }
  }

  $( "#toolbar *" )
      .not( "[ name |= 'select' ]" )
      .filter( ":button" )
      .each( function() {
        setEnabled( $( this ), EQUIVALENCES.length > 0 && ! LISTING_EQUIVALENCES ) ;
      }
  ) ;

  $( "#print-equivalences" ).each( function() {
    setEnabled( $( this ), EQUIVALENCES.length > 0 ) ;
  } ) ;

  var hasThemes =  $( "#theme-choice :checkbox" ).filter( ":enabled" ).length > 0 ;

  $( "#toolbar *" )
      .filter( "[ name |= 'select' ]" )
      .filter( ":button" )
      .each( function() {
        setEnabled( $( this ), hasThemes ) ;
      }
  ) ;



}
