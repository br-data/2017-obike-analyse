(function map() {

  var isAnimated = false;

  var width, height, data;

  var prefix = prefixMatch(['webkit', 'ms', 'Moz']);

  var tile = d3.geo.tile();
  var projection = d3.geo.mercator();
  var zoom = d3.behavior.zoom();

  var container = d3.select('#map');
  var streetmap = container.select('.streetmap');
  var canvas = container.select('.points');

  var context = canvas.node().getContext('2d');

  (function init() {

    updateDimensions();

    d3.csv('data/obike-munich.csv', function (error, json) {

      data = shuffle(json);

      handleResize();
      handleZoom();
    });
  })();

  function updateDimensions() {

    width = window.innerWidth;
    height = window.innerHeight;

    tile.size([width, height]);

    projection
      .scale((1 << 20) / 2 / Math.PI)
      .translate([-width / 2, -height / 2]);

    zoom
      .scale(projection.scale() * 2 * Math.PI)
      .scaleExtent([1 << 9, 1 << 25])
      .translate(projection([11.566, 48.137]).map(function (x) { return -x; }))
      .on('zoom', handleZoom);

    container
      .style('width', width + 'px')
      .style('height', height + 'px')
      .call(zoom);

    canvas
      .attr('width', width)
      .attr('height', height);
  }

  function drawCanvas() {

    data.forEach(function (d, i) {

      if (isAnimated) {

        setTimeout(function () {

          drawCircle(d);
        }, (Math.random() * (100 / Math.sqrt(i + 1)) * i + 2000));
      } else {

        drawCircle(d);
      }
    });
  }

  function drawCircle(d) {

    context.beginPath();

    // context.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    context.arc(
      projection([d.y,d.x])[0],
      projection([d.y,d.x])[1],
      3,
      0,
      2 * Math.PI
    );

    context.fillStyle = 'rgba(255,184,58,0.8)';
    context.fill();

    context.closePath();
  }

  function updateCanvas() {

    context.clearRect(0, 0, width, height);
    drawCanvas();
  }

  function handleZoom() {

    var tiles = tile
      .scale(zoom.scale())
      .translate(zoom.translate())();

    var image = streetmap
      .style(prefix + 'transform', matrix3d(tiles.scale, tiles.translate))
      .selectAll('.tile')
      .data(tiles, function (d) { return d; });

    image.exit()
      .remove();

    image.enter().append('img')
      .attr('class', 'tile')
      .attr('src', function (d) { return 'http://' + ['a', 'b', 'c'][Math.random() * 3 | 0] + '.basemaps.cartocdn.com/light_all/' + d[2] + '/' + d[0] + '/' + d[1] + '.png'; })
      .style('left', function (d) { return (d[0] << 8) + 'px'; })
      .style('top', function (d) { return (d[1] << 8) + 'px'; });

    projection
      .scale(zoom.scale() / 2 / Math.PI)
      .translate(zoom.translate());

    updateCanvas();
  }

  function handleResize() {

    var timeout;

    window.onresize = function () {

      clearTimeout(timeout);
      timeout = setTimeout(function () {

        updateDimensions();
        updateCanvas();
        handleZoom();
      }, 200);
    };
  }

  function matrix3d(scale, translate) {

    var k = scale / 256;
    var r = scale % 1 ? Number : Math.round;

    return 'matrix3d(' + [
      k, 0, 0, 0, 0,
      k, 0, 0, 0, 0,
      k, 0, r(translate[0] * scale), r(translate[1] * scale), 0, 1
    ] + ')';
  }

  function prefixMatch(p) {

    var i = -1;
    var n = p.length;
    var s = document.body.style;

    while (++i < n) {

      if (p[i] + 'Transform' in s) {

        return '-' + p[i].toLowerCase() + '-';
      }
    }

    return '';
  }

  function shuffle(array) {

    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {

      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }
})();
