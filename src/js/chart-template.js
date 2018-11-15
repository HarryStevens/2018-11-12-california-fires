import {
  extent
} from "d3-array";
import {
  axisBottom,
  axisLeft
} from "d3-axis";
import {
  scaleLinear
} from "d3-scale";
import {
  select
} from "d3-selection";
import {
  line
} from "d3-shape";
import {
  stats
} from "science";

export default class makeChart {
  constructor(opts) {
    Object.assign(this, opts);
    this.temperature_data.forEach(d => {
      d.year = +d.year;
      return d;
    });

    this.temperature_data = this.temperature_data.filter(f => f.year > 1959);

    var loess = stats.loess()
      .bandwidth(.25);
    var loess_gen = loess(this.temperature_data.map(d => d.year), this.temperature_data.map(d => d.value));
    this.loess_data = this.temperature_data.map((d, i) => ({year: d.year, value: loess_gen[i]}));

    this.aspectHeight = opts.aspectHeight ? opts.aspectHeight : 0.68;
    this.appendElements();
    this.update();
  }

  update() {
    this._setDimensions();
    this._setScales();
    this._setGenerators();
    this.render();
  }

  _setDimensions() {
    // define width, height and margin
    this.margin = {
      top: 10,
      right: 20,
      bottom: 32,
      left: 38,
    };

    this.width =
      this.element.offsetWidth - this.margin.left - this.margin.right;
    //Determine desired height here
    this.height =
      this.element.offsetWidth * this.aspectHeight -
      this.margin.top -
      this.margin.bottom;
  }

  _setScales() {
    this.xScale = scaleLinear()
      .rangeRound([0, this.width])
      .domain(extent(this.temperature_data, d => d.year));

    this.yScale = scaleLinear()
      .rangeRound([this.height, 0])
      .domain(extent(this.temperature_data, d => d.value));
  }

  _setGenerators() {
    this.lineGenerator = line()
      .x(d => this.xScale(d.year))
      .y(d => this.yScale(d.value));    
  }

  appendElements() {
    this.svg = select(this.element).append("svg");

    this.plot = this.svg.append("g").attr("class", "chart-g");

    this.xAxis = this.plot.append("g").classed("axis x-axis", true);

    this.yAxis = this.plot.append("g").classed("axis y-axis", true);

    this.dots = this.plot.selectAll(".dot")
        .data(this.temperature_data)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3);

    this.line = this.plot.append("path")
        .datum(this.loess_data)
        .attr("class", "line");
  }

  render() {
    this.svg.attr("width", this.width + this.margin.left + this.margin.right);
    this.svg.attr("height", this.height + this.margin.top + this.margin.bottom);

    this.plot.attr(
      "transform",
      `translate(${this.margin.left},${this.margin.top})`
    );

    this.xAxis
      .attr("transform", "translate(0," + (this.height + 20) + ")")
      .call(axisBottom(this.xScale).tickSize(-this.height - 20).tickValues([1900, 1925, 1950, 1975, 2000, 2017]).tickFormat(d => d));

    this.yAxis
      .attr("transform", "translate(" + -20 + ",0)")
      .call(axisLeft(this.yScale).tickSize(-this.width - 20)
        // .tickValues([57, 60, 64]).tickFormat(d => d)
      );

    this.dots
        .attr("cx", d => this.xScale(d.year))
        .attr("cy", d => this.yScale(d.value));

    this.line
        .attr("d", this.lineGenerator);
  }
}