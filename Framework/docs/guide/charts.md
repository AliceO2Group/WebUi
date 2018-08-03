# Frontend - Charts

The Framework includes a chart drawing tool for time based series.

- [See demo on jsfiddle](http://jsfiddle.net/vkosmala/dhpe5gzb/)
- [Full API documentation](../reference/frontend-api.md#chartTimeSerie)

## Usage

Charts have a name, array of values (with associated timestamp) and a time scaling factor to zoom-in or zoom-out.

- X axis is time based, "now" is defined as the border right, only recent data will be plot, older ones will be out of scope.
- Y axis has a dynamic range between minimal and maximal values.

```js
import {h, chartTimeSerie} from '../../Frontend/js/src/index.js';

h('div.m4', [
  chartTimeSerie({
    serie: [{value: 10, timestamp: Date.now()}, ...],
    title: 'Temperature',
    colorPrimary: 'red',
    width: '800',
  }),
]),
```

![Example of chart usage](../images/charts-timeserie.png)

## Performance

Drawing is optimized for intensive use, example above shows updating 4 plots of 265 points each is rendered at 100 FPS on a 2015 Intel i5 laptop (60 FPS is considered fluid).

Recommandations:
- keep page drawing time under 15ms (60 FPS)
- draw only what will be seen by user, use tabs if needed
- reduce number of points to draw, only first values of array will be drawn depending of scale, width and density

Performance factors:
- scale is defined by `timeScale` in ms
- width is defined by `width` in pixel
- density is defined by `serie` array and how many values per time range
