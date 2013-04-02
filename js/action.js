// Performs an action that may take several steps to complete.
// This lets window thread decide to start the next step, or simply not because another action
// superceded this one. When selecting a lot of Cards (10.000 or more), one single DOM update would
// choke the browser for several seconds. Instead, small incremental updates, while taking
// longer in cumulated time, let the window thread "breath" and quickly respond to the user
// adjusting his choice, before the whole result finished a lengthy DOM update.
// For avoiding too small increments, the ActionPerformer executes steps in batches.
// The ActionPerformer supports single-stepped actions as a simplification of the multi-step case.
var ActionPerformer = function() {

  var constructor = function ActionPerformer( context, action ) {

    var batch = 0 ;
    var totalTime = 0 ;

    this.perform = function() {

      function logCompletion( action, totalTime ) {
        context.log( 'ActionPerformer completed ' + action + ' action ' + context.id
            + ' in ' + totalTime + ' ms.' ) ;
      }

      var start = new Date() ;
      if( batch == 0 ) context.log( 'Starting action ' + context.id + ' ...' ) ;
      if( action.singleStep ) {
        action.singleStep( context.id ) ;
        context.onActionComplete() ;
        logCompletion( 'single-step', new Date() - start ) ;
      } else if( action.isComplete() ) {
        context.onActionComplete() ;
        logCompletion( 'multi-step', totalTime ) ;
      } else {
        for( var i = 0 ; i < context.batchSize ; i ++ ) {
          action.step( i == 0, context.id, batch ) ;
          if( action.isComplete() ) break ;
        }
        context.onBatchComplete() ;
        batch ++ ;
        totalTime += new Date() - start ;
        return this ;
      }
      return null ; // Action complete.
    }

  } ;

  return constructor ;
}() ;

var LongDummyAction = function() {

  var constructor = function LongDummyAction( stepCount ) {

    var currentStep = 0 ;

    this.isComplete = function() {
      return currentStep >= stepCount ;
    }

    this.step = function( newBatch, id, batch ) {
      var html = newBatch ? '' : '<p>Initialized ' + this.constructor.name + '</p>' ;

      html += '<table>' ;
      html += '  <tbody>' ;
      html += '    <tr>' ;
      html += '      <td>Action</td>' ;
      html += '      <td>' + id + '</td>' ;
      html += '    </tr>' ;
      html += '    <tr>' ;
      html += '      <td>Batch</td>' ;
      html += '      <td>' + batch + '</td>' ;
      html += '    </tr>' ;
      html += '    <tr>' ;
      html += '      <td>Step</td>' ;
      html += '      <td>' + currentStep + '</td>' ;
      html += '    </tr>' ;
      html += '  </tbody>' ;
      html += '</table>' ;
      html += '<p></p>' ;

      $( '#board' ).append( html ) ;
      currentStep ++ ;
    }


  }

  return constructor ;
}() ;


var ShortDummyAction = function() {

  var constructor = function ShortDummyAction( flag ) {

    this.singleStep = function( id ) {
      var html = '<p>Initialized ' + this.constructor.name + '</p>' ;
      html += '<table>' ;
      html += '  <tbody>' ;
      html += '    <tr>' ;
      html += '      <td>Action</td>' ;
      html += '      <td>' + id + '</td>' ;
      html += '    </tr>' ;
      html += '    <tr>' ;
      html += '      <td>Flag</td>' ;
      html += '      <td>' + flag + '</td>' ;
      html += '    </tr>' ;
      html += '  </tbody>' ;
      html += '</table>' ;
      html += '<p></p>' ;

      $( '#board' ).html( html ) ;
    }
  }

  return constructor ;
}() ;


// Represents the state that user put the application into by its various actions.
var Advance = function() {
  // vocabulary: a Vocabulary instance.
  // initiator: value of window.location.search that reflects the state in another session.
  var constructor = function Advance( vocabulary, initiator ) {

    var tags = [] ;
    var cards = [] ;
    var currentCard = null ;
    var viewAsList = false ;

    // TODO use initiator.

    this.selectTags = function( tags, selected ) {
      if( typeof tags === 'string' ) {
        this.tags = [ tags ] ;
      } else {
        this.tags = tags.slice( 0 ) ;
      }
      var PreviousCard = currentCards ;
      cards = [] ;
      vocabulary.visitCards( function( card ) {
        if( card.hasTag( tags ) ) cards.push( card ) ;
      } ) ;
      for( var c = 0 ; c < cards.length ; c ++ ) {
        if( cards[ c ] == previousCard ) {
          currentCard = previousCard ;
        } else {
          throw 'TODO: random Card choice' ;
        }
      }
    }

    // Returns array copy. Not a great deal as we use it only for debugging.
    this.tags = function() {
      return tags.slice( 0 ) ;
    }

    // Returns array copy. Not a great deal as we use it only for debugging.
    this.cards = function() {
      return cards.slice( 0 ) ;
    }

  }
  return constructor ;
}

var advance = new Advance() ;

