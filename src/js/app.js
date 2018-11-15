import setup from "./setup";
setup();

import pym from "pym.js";
// import { setupVisualsGoogleAnalytics, trackEvent } from "./analytics";

import { extent, range } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleLinear } from "d3-scale";
import { select, selectAll } from "d3-selection";
import { line } from "d3-shape";
import { voronoi } from "d3-voronoi";
import { stats } from "science";
import fire_data from "../data/cali-fire-acres_1950-2017.json";
import temp_data from "../data/cali-temp_1950-2017.json";

function main() {
  var start_year = 1960;

  var data = [temp_data, fire_data].map((dataset, index) => {
    var variable = index === 0 ? "temperature" : "fires";
    dataset = dataset.map(d => ({variable: variable, year: d.year, value: d.value})).filter(f => f.year >= start_year);
    var subhead = index === 0 ? "Average annual temperature (°F)" : "Acres burned in fires";
    var loess_generator = stats.loess()
      .bandwidth(.22);
    var loess_values = loess_generator(dataset.map(d => d.year), dataset.map(d => d.value));
    var loess = dataset.map((d, i) => ({variable: variable, year: d.year, value: loess_values[i]}));

    var y_domain = index == 0 ? [56, 64] : [0, 1.5e6];
    var y_scale = scaleLinear().domain(y_domain);
    var y_axis_generator = axisLeft()
      .tickValues(index === 0 ? [56, 60, 64] : [0, .75e6, 1.5e6])
      .tickFormat((d, i) => index === 0 ? d : i === 0 ? 0 : d > 1e6 ? (d / 1e6).toFixed(1) + "m" : (d / 1e3) + "k");

    var line_generator = line()
      .x(d => x_scale(d.year))
      .y(d => y_scale(d.value));

    var voronoi_generator = voronoi()
      .x(d => x_scale(d.year))
      .y(d => y_scale(d.value));

    return {
      variable: variable,
      subhead: subhead,
      data: dataset,
      loess: loess,
      y_domain: y_domain,
      y_scale: y_scale,
      y_axis_generator: y_axis_generator,
      line_generator: line_generator,
      voronoi_generator: voronoi_generator
    }
  });

  function formatSelect(d){
    if (d.variable === "temperature"){
      return Math.round(d.value) + "°F"
    }
    else {
      return (d.value > 1e6 ? (d.value / 1e6).toFixed(1) + "m" : (Math.round(d.value / 1e3)) + "k") + " acres";
    }
  }

  var labels_data = [2009];

  var container = select(".chart-container");
  var aspect_ratio = .68,
      margin = {left: 55, right: 8, top: 35, bottom: 35},
      width,
      height,
      min_height = 200,
      max_height = 280;

  var charts = container.selectAll(".chart")
      .data(data)
    .enter().append("div")
      .attr("class", d => "chart " + d.variable);

  charts.append("div")
      .attr("class", "subhead")
      .text(d => d.subhead);

  var svg = charts.append("svg");
  var g = svg.append("g")
      .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  var x_scale = scaleLinear()
    .domain([start_year, 2017]);
  
  var x_tick_values = range(1960, 2020, 10);
  x_tick_values.push(2017)

  var x_axis_generator = axisBottom()
    .tickValues(x_tick_values)
    .tickFormat(d => d === 1960 || d === 2000 ? d : "`" + d.toString().slice(2, 4))
  
  var x_axis = g.append("g")
      .attr("class", "x-axis axis");

  var y_axis = g.append("g")
      .attr("class", d => "y-axis axis " + d.variable);

  var dots = g.selectAll(".dot")
      .data(d => d.data)
    .enter().append("circle")
      .attr("class", d => "dot dot-" + d.year)
      .attr("r", 2.5);

  var lines = g.append("path")
      .datum(d => d.loess)
      .attr("class", "line");

  var select_text = g.append("g")
      .attr("class", "select-text");

  var select_year_bg = select_text.append("text").attr("class", "select-year bg");
  var select_year_fg = select_text.append("text").attr("class", "select-year fg");

  var select_value_bg = select_text.append("text").attr("class", "select-value bg")
      .attr("dy", 16);
  var select_value_fg = select_text.append("text").attr("class", "select-value fg")
      .attr("dy", 16);

  function draw(){
    width = select(".chart").node().getBoundingClientRect().width - margin.left - margin.right;
    var base_height = width * aspect_ratio;
    base_height = base_height < min_height ? min_height : base_height > max_height ? max_height : base_height;
    height = base_height - margin.top - margin.bottom;
    svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    x_scale.range([0, width]);

    x_axis
        .call(
          x_axis_generator
            .scale(x_scale)
            .tickSize(height + 20)
        )
      .selectAll("text")
        .attr("dx", d => d === 1960 || d === 2000 ? 0 : -4)

    data.forEach((facet, index) => {
      facet.y_scale.range([height, 0]);
      facet.y_axis_generator
        .scale(facet.y_scale)
        .tickSize(width + (index === 0 ? 36 : 20));

      facet.voronoi_generator
        .extent([[0, 0], [width, height]]);

      select(".y-axis." + facet.variable)
          .attr("transform", "translate(" + width + ", 0)")
          .call(facet.y_axis_generator);

    });

    over(data[0].data.filter(f => f.year === 2017)[0])

    dots
        .attr("cx", d => x_scale(d.year))
        .attr("cy", d => lookupFacet(d).y_scale(d.value))
        .on("mouseover", over)
        .on("mouseout", out);

    lines
        .attr("d", d => lookupFacet(d[0]).line_generator(d));

    var voronois = g.selectAll(".voronoi")
        .data(d => d.voronoi_generator(d.data).polygons(), d => d ? d.data.year : null)

    voronois.enter().append("path")
        .attr("class", "voronoi")
      .merge(voronois)
        .attr("d", d => d ? "M" + d.join("L") + "Z" : null)
        .lower()
        .on("mouseover", d => over(d.data))
        .on("mouseout", d => out(d.data));

    function over(d){
      selectAll(".dot").classed("selected", 0);
      selectAll(".dot-" + d.year).classed("selected", 1).raise();

      var other_facet = data.filter(f => f.variable !== d.variable)[0]
      var other_datum = other_facet.data.filter(f => f.year === d.year)[0]


      select_text
          .classed("show", 1)
          .raise()
          .attr("transform", d0 => `translate(${x_scale(d.year)},${-25 + lookupFacet(d0).y_scale(d.variable === d0.variable ? d.value : other_datum.value)})`);
      
      selectAll(".select-year").text(d.year);
      selectAll(".select-value").text(d0 => formatSelect({variable: d0.variable, value: d.variable === d0.variable ? d.value : other_datum.value}));

      selectAll(".select-text text")
          .style("text-anchor", d.year > 2010 ? "end" : "middle");


    }
    function out(d){
      selectAll(".dot-" + d.year).classed("selected", 0);
      lines.raise();
      select_text.classed("show", 0);
    }

  }

  draw();


  window.addEventListener("optimizedResize", draw);

  new pym.Child({ polling: 500 });

  function lookupFacet(d){
    return data.filter(f => f.variable === d.variable)[0];
  }
}

window.onload = main;

