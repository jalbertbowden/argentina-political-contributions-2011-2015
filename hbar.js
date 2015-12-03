var testvar;

d3.json('styles.json', function(error, s) {

        // Parameters for top-level sizing of plot
        var blog_or_feature = 'feature';
        var desired_height = 1200;
        // x axis label caption
        var units = '';
        var div_selector = "#hbar-chart";
        var bar_color = "yellow";

        // TODO: (optionally?) Apply styles dynamically
        var decFormat = d3.format(',.1f');
        
        var formatMoney = function (e) {
            var currencyString;
            var abs_e = Math.abs(e);
            currencyString = decFormat(abs_e/1000000)+"M";
            /*
            if (abs_e < 1000) {
                currencyString = decFormat(e);
            } else if (abs_e > 999           && e < 1000000) {
                currencyString = decFormat(abs_e/1000)+"K";
            } else if (abs_e > 999999        && e < 1000000000){
                currencyString = decFormat(abs_e/1000000)+"M"
            } else if (abs_e > 999999999     && e < 1000000000000){
                currencyString = decFormat(abs_e/1000000000)+"B"
            } else {
                // cry(forever);
                currencyString = decFormat(abs_e/1000000000000) + "T"
            }
            */
            if (e < 0) {
                return "-$" + currencyString;
            } else {
                return "$" + currencyString;
            }
        };


        d3.json('data-2011.json', function(error, data) {
        		//  select chart container using a class selector
            var svg = d3.select(div_selector+' svg');
            // maxValue sets the maximum value amount to be shown in the graph. here it is the var furthest right on the x axis
            console.log(data)
            var maxValue = d3.max(data, function(d) { return d.value; });
            var minValue = d3.min(data, function(d) { return d.value; });

            console.log(maxValue)
            // set to 3 million
            //

            var xFormatter = d3.format(",.0f");

            /*
             * Setting margins according to longest yAxis label, default to styles.json
             */

            //  ... get default margins from specs
            var margin = s.plot_elements.canvas.margin;

            //  ... create invisible text object
            var testYAxis = svg.append("g")
                              .attr("class", "axis");
            var testYaxisLabels = testYAxis.selectAll("text")
                              .data(data)
                              .enter()
                              .append("text")
                              .attr("class", "test-text")
                              .attr("y", -1000)
                              .classed("axis", "true")
                              .text(function(d){ return d.label });

            //  ... measure width of invisible text object
            var yLabelWidth = Math.max(testYAxis[0][0].getBoundingClientRect().width, 0);

            //  ... use larger of two margins
            var suggestedLeftMargin = yLabelWidth + parseInt(s.text_styles.axis_title['font-size']) + 2 + s.plot_elements.axis.title_padding;  // plus 2 related to space above/below text
            
            margin.left = Math.max(margin.left, suggestedLeftMargin);
             //

            //  ... follow D3 margin convention as normal
            var width = s.plot_elements.canvas.width[blog_or_feature] - margin.left - margin.right,
                height = desired_height - margin.top - margin.bottom;

            svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

            /*
             * Creating scales
             */
             // .1 is amount of space between output values; rangeRoundBands takes a low and high value, and automagically divides it into even chunks/bands based on the length of the domain
             // ex: .rangeBands([0, w]) says calculate even bands starting @ 0 and ending @ w, then set this scale's range to those bands
            var y = d3.scale.ordinal()
                    .rangeRoundBands([0, height], .1)
                    .domain(data.map(function(d) { return d.label; }));

            // make dependencies explicit and eliminate magic numbers by using a linear scale
            // d3s scales specify a mapping from data space (domain) to display space (range)
            // x looks like an object, its also a function that returns the scaled display value in the range for a given data value in the domain.     


            var x = d3.scale.linear()
                    .range([0.1, width])
                    .domain([-500000, 3000000])
                    .nice();

            /*
             * Creating Axes and Gridlines (innerTick)
             */
            testvar = x;

            var yAxis = d3.svg.axis()
                .scale(y)
                .innerTickSize(-width) // really long ticks become gridlines
                .outerTickSize(0)
                .tickPadding(5)
                .orient("left");

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .innerTickSize(-height) // really long ticks become gridlines
                .outerTickSize(0)
                .tickPadding(5)
                .tickValues([-500000,0, 500000, 1000000, 1500000, 2000000, 2500000, 3000000]) // setting tick values explicitly
                .tickFormat(formatMoney);

            /*
             * Drawing chart
             */

            var basicChart = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            //  ... add x axis
            basicChart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
              .append("text")
                .classed("title",true)
                .attr("x", function() { return (width / 2.0);}) // anchors title in middle of chart

                .attr("y", function() { return (margin.bottom);})
                .style("text-anchor", "middle") // centers title around anchor
                .text("X Axis Title");

            //  ... add y axis with value labels
            basicChart.append("g")
                .attr("class", "y axis")
                .call(yAxis)
              .append("text")
                .classed("title",true)
                .attr("transform", "rotate(-90)")
                .attr("x", function() { return -(height / 2.0);})
                // .attr("x", function() { return -50;})
                .attr("y", function() { return -(margin.left);})
                // .attr("y", function() { return 50;})
                .attr("dy", function() { return (parseInt(s.text_styles.axis_label['font-size'])-2); }) // minus 2 related to space above/below text
                .style("text-anchor", "middle")
                // .text("Y Axis Title");

            //  ... add value units to value labels in separate span for distinct styling
            d3.select(div_selector + ' .x.axis')
            // initiate data join
                .selectAll('.tick')
                .select('text')
              .append("tspan")
                .classed("unit", true)
                .text(" " + units);

            //  ... add bars using bar_color (set above) for fill; initiate data join
            basicChart.selectAll(".bar")
            // join data defined previously to selection 
                .data(data)
                // we know selection is empty, the returned update and exit selections are also empty
                // so we only handle the enter selection which represents new data for which there was no existing element
                // we instantiate these missing elements by appending to the enter selection.
              .enter().append("rect")
                .attr("class","bar")
                // d = associated data value; here its y.label
                .attr("y", function(d) { return y(d.label); })
                // element created by data join, so each is alredy bound to data. 
                // set dimensions of each bar by passing a function to compute height
                .attr("height", y.rangeBand())
                // d = associated data value; here its x.value
                .attr("x", function(d) { 
                    if (d.value < 0) { return x(d.value); }

                    return x(0); })
                                // element created by data join, so each is alredy bound to data. 
                // set dimensions of each bar by passing a function to compute height
                .attr("width", function(d) {
                    if (d.value < 0) { d.value = Math.abs(d.value); }
                        return x(d.value)-x(0);
                    })
                        //return x_test(d.value)(d.value); })
                
                .style("fill", function(d) { return s.colors.data.main[bar_color].hex;} );
        });

});
