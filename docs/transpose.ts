import * as $ from 'jquery'
// import 'DataTables.net'
import 'pivottable'
// import subtotalMultipleAggregates from 'subtotal-multiple-aggregates'
import { handleErrors, formatType } from '../common/utils'

declare var require: any
// const themeClassic = require('subtotal-multiple-aggregates/dist/looker-classic.css')
// const themeWhite = require('subtotal-multiple-aggregates/dist/looker-white.css')

import { Looker, VisualizationDefinition } from '../types/types'

declare var looker: Looker

type Formatter = ((s: any) => string)
const defaultFormatter: Formatter = (x) => x.toString()

const LOOKER_ROW_TOTAL_KEY = '$$$_row_total_$$$'

// subtotalMultipleAggregates($)

interface Subtotal extends VisualizationDefinition {
  style?: HTMLElement
}

const vis: Subtotal = {
  id: 'subtotal',
  label: 'Subtotal',

  options: {
    // show_full_field_name: {
    //   type: 'boolean',
    //   label: 'Show Full Field Name',
    //   default: false
    // }
  },

  create (element, config) {
    this.style = document.createElement('style')
    document.head.appendChild(this.style)
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    if (!config || !data) return
    if (details && details.changed && details.changed.size) return
    if (!this.style) return

    if (!handleErrors(this, queryResponse, {
      min_pivots: 0, max_pivots: 0,
      min_dimensions: 1, max_dimensions: 1,
      min_measures: 1, max_measures: Infinity
    })) return

    // const theme = config.theme || this.options.theme.default
    // switch (theme) {
    //   case 'classic':
    //     this.style.innerHTML = themeClassic.toString()
    //     break
    //   case 'white':
    //     this.style.innerHTML = themeWhite.toString()
    //     break
    //   default:
    //     throw new Error(`Unknown theme: ${theme}`)
    // }

    const pivots: string[] = queryResponse.fields.pivots.map((d: any) => d.name)
    const strDimensions: string[] = queryResponse.fields.dimensions.map((d: any) => d.name)
    const strTransDimensions: string[] = queryResponse.fields.dimensions.map((d: any) => d.value)
    const strMeasures: string[] = queryResponse.fields.measures.map((d: any) => d.name)
    const dimensions = queryResponse.fields.dimensions
    const measures = queryResponse.fields.measures

    // const labels: { [key: string]: any } = {}
    // for (const key of Object.keys(config.query_fields)) {
    //   const obj = config.query_fields[key]
    //   for (const field of obj) {
    //     const { name, view_label: label1, label_short: label2 } = field
    //     labels[name] = config.show_full_field_name ? { label: label1, sublabel: label2 } : { label: label2 }
    //   }
    // }

    // console.log(labels)



    const pivotSet: { [key: string]: boolean } = {}
    for (const pivot of pivots) {
      pivotSet[pivot] = true
    }

    const ptData = []
    //each row of data (determined by the unique values in dimention)
    for (const row of data) {
      const ptRow: { [key: string]: any } = {}
      //each key in the row object
      for (const key of Object.keys(row)) {
        //assign the key to the row object
        const obj = row[key]
        ptRow[key] = obj.value
      }
      // No pivoting, just add each data row.
      ptData.push(ptRow)
    }

    // transpose data into array of key value pair
    const transData = []
    var firstRow = data[0]
    // for each measure, create a row of data
    for (const measure_row of measures){
      const transRow: { [key: string]: any } = {}
      //set the first column as 'Metric'
      transRow['Metric'] = measure_row.name
      //for each row of data, assign the key to the 
      for (const row of data){
        const obj = row[measure_row.name]
        //construct key name based on dimension values
        const key_name = row[dimensions[0].name].value
        transRow[key_name] = obj.rendered
      }
      transData.push(transRow)
    }
    
    console.log(transData)
    console.log(data)

    // We create our own aggregators instead of using
    // $.pivotUtilities.aggregators because we want to use our own configurable
    // number formatter for some of them.
    const intFormat = formatType('###,###,###,##0')

    strMeasures.unshift('Metric')

    const strColumns = []
    for(const str of strMeasures){
      const strColumnRow: { [key: string]: any } = {}
      strColumnRow['data'] = str
      strColumns.push(strColumnRow)
    }

    console.log(strColumns)

    const options = {
      rows: strMeasures,
      columns: strDimensions,
      hasColTotals: false,
      hasRowTotals: false
    }

    $(element).DataTable({
      data: transData,
      columns: strColumns
    })
  }
}

looker.plugins.visualizations.add(vis)
