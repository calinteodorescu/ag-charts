import type {
  AgCartesianSeriesTooltipRendererParams,
  AgChartOptions,
  AgTooltipRendererResult} from "ag-charts-community";
import {
  AgCharts
} from "ag-charts-community"
import { getData } from "./data"

const numFormatter = new Intl.NumberFormat("en-US")
const tooltip = {
  renderer: ({ title, datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams): AgTooltipRendererResult => ({
    title,
    content: `${datum[xKey]}: ${numFormatter.format(datum[yKey])}`,
  }),
}

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  data: getData(),
  theme: {
    palette: {
      fills: ["#5BC0EB", "#FDE74C", "#9BC53D", "#E55934", "#FA7921"],
      strokes: ["#4086a4", "#b1a235", "#6c8a2b", "#a03e24", "#af5517"],
    },
    overrides: {
      bar: {
        series: {
          strokeWidth: 0,
          highlightStyle: {
            series: {
              strokeWidth: 1,
              dimOpacity: 0.3,
            },
          },
        },
      },
    },
  },
  title: {
    text: "Average Station Entries",
    fontSize: 18,
  },
  subtitle: {
    text: "Victoria Line (2010)",
  },
  footnote: {
    text: "Source: Transport for London",
  },
  series: [
    {
      type: "bar",
      xKey: "station",
      yKey: "early",
      stacked: true,
      yName: "Early",
      tooltip,
    },
    {
      type: "bar",
      xKey: "station",
      yKey: "morningPeak",
      yName: "Morning peak",
      stacked: true,
      tooltip,
    },
    {
      type: "bar",
      xKey: "station",
      yKey: "interPeak",
      yName: "Between peak",
      stacked: true,
      tooltip,
    },
    {
      type: "bar",
      xKey: "station",
      yKey: "afternoonPeak",
      yName: "Afternoon peak",
      stacked: true,
      tooltip,
    },
    {
      type: "bar",
      xKey: "station",
      yKey: "evening",
      yName: "Evening",
      stacked: true,
      tooltip,
    },
  ],
  axes: [
    {
      type: "category",
      position: "bottom",
      label: {
        rotation: 30,
      },
    },
    {
      type: "number",
      position: "left",
      label: {
        formatter: params => {
          return params.value / 1000 + "k"
        },
      },
    },
  ],
  padding: {
    bottom: 40,
  },
}

const chart = AgCharts.create(options)
