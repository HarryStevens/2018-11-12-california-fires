var io = require("indian-ocean"),
    jz = require("jeezy");

var input = io.readDataSync("cal-fires.json");

// var temperatures = io.readDataSync("../../src/data/cali-temp_1950-2017.json");

var years = jz.arr.uniqueBy(input, "YEAR").filter(year => year && year !== "2018")

var output = jz.arr.sortBy(years.map(year => {
  var lookup = input.filter(f => f.YEAR === year && +f.GIS_ACRES);
  return {
    year: +year,
    value: lookup.length ? jz.arr.sum(lookup.map(d => +d.GIS_ACRES)) : 0
  }
}), "year").filter(f => f.year < 2018 && f.year >= 1950)

io.writeDataSync("acres-per-year.csv", output);
io.writeDataSync("../../src/data/cali-fire-acres_1950-2017.json", output);