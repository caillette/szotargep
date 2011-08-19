// =======================
// Constants for everybody
// =======================

var UNDEFINED = "undefined" ;
var CHECKED = "checked" ;
var UNCHECKED = "unchecked" ;
var UNAVAILABLE = "unavailable" ;

var LANGUAGE_1 = "LANGUAGE_1" ;
var LANGUAGE_2 = "LANGUAGE_2" ;

var EQUIVALENCES = "EQUIVALENCES" ;


// =======
// Parsing
// =======

// Equivalence: a pair of Words.
// Word: what's in a non-indented line.
// Definition: the indented lines relative to a Word.


var characters = ",;!\\?\\-\\wáéíóúÁÉÚÍÓÚőűŐŰöüÜÖœàâèêëïîôûçŒÀÂÈÊËÏÎÔÛÇ" ;
var textExp = "(?:[" + characters + "][ " + characters + "]*)" ;
var termExp = textExp ;
var definitionLineExp = "(?: +" + textExp + ")" ;
var definitionLineCapturingExp = "(?: +(" + textExp + "))" ;


function parseEquivalences( text ) {
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
    array.push( { LANGUAGE_1 : array1, LANGUAGE_2 : array2 } ) ;
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
  $( "p#messages" ).append( "<pre>" + message.toString() + "</pre>" ) ;
}



// All declared themes.
// An array of of associative arrays where each element represents a theme.
// No guard against concurrent access needed since JavaScript is monothreaded
// (though asynchronous).
// http://stackoverflow.com/questions/2253586/thread-safety-in-javascript
var THEMES = [] ;

function environmentSetup() {

  THEMES.byKey = function( key ) {
    for( index in this ) {
      var theme = this[ index ] ;
      if( theme.key == key ) {
        return theme ;
      }
    }
    showMessage( "Not found: " + key ) ;
    return null ;
  } ;

  // http://stackoverflow.com/questions/330331/jquery-get-charset-of-reply-when-no-header-is-set
  $.ajaxSetup( {
    "beforeSend" : function( xhr ) {
      xhr.overrideMimeType( "text/html; charset=UTF-8" ) ;
    }
  } ) ;
}

function initializeThemes() {

  $( "#themes> dt" ).each( function() {
    var themeKey = $( this ).text() ;
    THEMES.push( { key : themeKey, status : UNDEFINED } ) ;
  } ) ;

  showMessage( "Loading themes..." ) ;
  for( index in THEMES ) {
    var theme = THEMES[ index ] ;
    loadTheme( theme.key ) ;
  }
}



// Loads a theme, with various side effects on the DOM for the checkboxes and on the THEMES array.
function loadTheme( themeKey ) {
  showMessage( "Loading " + themeKey + "..." ) ;
  var theme = THEMES.byKey( themeKey ) ;

  $.get( themeKey, function( payload ) {
    var equivalences = parseEquivalences( payload ) ;

    theme.equivalences = equivalences ;
    theme.status = UNCHECKED ;
    $( "#theme-choice" ).append(
        "<input "
            + "type ='checkbox' "
            + "name ='theme-" + themeKey + "' "
            + "onclick ='checkTheme() ; ' "
        + ">"
        + "<span>" + themeKey + "</span>"
        + "<br/>"
    ) ;

  } ).error( function() {
    theme.status = UNAVAILABLE ;
    $( "#theme-choice" ).append(
        "<input "
            + "type ='checkbox' "
            + "name ='theme-" + themeKey + "' "
            + "disabled ='disabled' "
        + ">"
        + "<span style = 'text-decoration : line-through ;' >" + themeKey + "</span>"
        + "<br/>"
    ) ;

  } ) ;

}



// ===============
// Theme selection
// ===============

function checkTheme() {
  alert( "Theme checked/unchecked" ) ;
}
