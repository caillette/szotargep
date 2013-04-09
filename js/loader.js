( function ( szotargep ) {

  szotargep.loader = {} ;

  szotargep.loader.load = function( div, search, onSuccess, onFailure ) {

    function report( problem ) {
      if( div != null ) {
        $( div ).append( '<p>' + problem + '</p>') ;
      }
      window.console.error( problem ) ;
    }

    szotargep.parser.createDefaultParsers(
      function( parsers ) {
        var parsersHealthy = true ;
        for( p = 0 ; p < parsers.length ; p ++ ) {
          if( parsers[ p ].problem() ) {
            report( parsers[ p ].problem() ) ;
            parsersHealthy = false ;
          }
        }

        if( parsersHealthy ) {

          function find( parsers, uri ) { return szotargep.parser.findParser( parsers, uri ) }

          try {
            var searchParser = find( parsers, szotargep.parser.SEARCH_GRAMMAR_URI ) ;
            var vocabularyParser = find( parsers, szotargep.parser.VOCABULARY_GRAMMAR_URI ) ;
            var packParser = find( parsers, szotargep.parser.PACK_GRAMMAR_URI ) ;
            try {
              var locationSearch =
                  new szotargep.loader.LocationSearch( searchParser.parse( search ) ) ;
            } catch( e ) {
              report( 'Could not interpret URL: ' + e ) ;
              return ;
            }
            var vocabularyUri = locationSearch.vocabulary() ;
            window.console.info( 'Loading vocabulary from ' + vocabularyUri + ' ...' ) ;

            szotargep.resource.loadResources(
                [ vocabularyUri ],
                function( resources ) {
                  var vocabularyList = resources[ 0 ].content ;
                  if( typeof vocabularyList === 'undefined' || vocabularyList === null ) {
                    report( 'Could not load ' + vocabularyUri ) ;
                    onFailure() ;
                  } else {
                    var parsedVocabulary = vocabularyParser.parse( vocabularyList ) ;
                    window.console.debug( 'Loaded ' + parsedVocabulary.length +
                      ' pack reference' + ( parsedVocabulary.length > 1 ? 's' : '' ) ) ;

                    szotargep.resource.processResources(
                        parsedVocabulary,
                        function( transformable ) {
                          if( transformable.problem ) {
                            return new szotargep.vocabulary.Pack(
                                transformable.uri, transformable.problem, null ) ;
                          } else {
                            return new szotargep.vocabulary.Pack(
                                transformable.uri, transformable.content, packParser ) ;
                          }
                        },
                        function( packs ) {
                          onSuccess(
                              new szotargep.vocabulary.Vocabulary( vocabularyUri, packs ),
                              locationSearch
                          ) ;
                        }
                    )
                  }
                }
            ) ;

          } catch( e ) {
            report( e ) ;
            onFailure() ;
          }
        } else {
          onFailure() ;
        }
      }
    ) ;

  }

  var defaultVocabulary = 'vocabulary.txt' ;

  szotargep.loader.isDefaultVocabulary = function( string ) {
    return defaultVocabulary === string ;
  }


  // JavaScript defines window.location.search as the way to get the parameters of window's URL.
  szotargep.loader.LocationSearch = function() {

    var constructor = function LocationSearch( parseResult ) {

      function byKey( key ) {
        for( var i = 0 ; i < parseResult.length ; i ++ ) {
          var entry = parseResult[ i ] ;
          if( entry[ 0 ] == key ) {
            return entry.length > 1 ? entry[ 1 ] : true ;
          }
        }
        return null ;
      }

      this.vocabulary = function() {
        var v = byKey( 'v' ) ;
        return v ? v : defaultVocabulary ;
      }

      this.flip = function() {
        return byKey( 'flip' ) != null ;
      }

      this.single = function() {
        return byKey( 'single' ) != null ;
      }

      this.tags = function() {
        var knownTags = byKey( 'tags' ) ;
        return knownTags ? knownTags.slice( 0 ) : null ;
      }
    }

    return constructor ;
  }() ;

} ( window.szotargep = window.szotargep || {} ) ) ;
