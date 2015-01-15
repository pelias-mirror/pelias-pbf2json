
var util = require('util'),
    path = require('path'),
    split = require('split'),
    through = require('through2'),
    child = require('child_process'),
    exec = path.resolve(__dirname, 'build/pbf2json');

function errorHandler( name ){
  return function( data ){
    console.log( util.format( '[%s]:', name ), data.toString('utf8') );
  };
}

function createReadStream( config ){

  var flags = [ util.format( '-tags=%s', config.tags ), config.file ];
  if( config.hasOwnProperty( 'leveldb' ) ){
    flags.push( util.format( '-leveldb=%s', config.leveldb ) );
  }

  var proc = child.spawn( exec, flags );

  var decoder = createJsonDecodeStream();
  proc.stdout.pipe( split() ).pipe( decoder );

  // print error and exit on decoder pipeline error
  decoder.on( 'error', errorHandler( 'decoder' ) );

  // print error and exit on stderr
  proc.stderr.on( 'data', errorHandler( 'stderr' ) );

  return decoder;
}

function createJsonDecodeStream(){
  return through.obj( function( chunk, enc, next ){
    try {
      var o = JSON.parse( chunk.toString('utf8') );
      if( o ){ this.push( o ); }
    }
    catch( e ){
      this.emit( 'error', e );
    }
    finally {
      next();
    }
  });
}

module.exports.createReadStream = createReadStream;