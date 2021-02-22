var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
var d3 = require('d3');
var config = require('../../config');

module.exports = Backbone.View.extend({
	graphWidth: 1120,
	graphHeight: 26,

	colors: {
		S: '#ffcf72',
		C: '#d2ff72',
		L: '#adcdee',
		M: '#f49df1'
	},

	graphMargins: {
		top: 20,
		right: 0,
		bottom: 20,
		left: 60
	},

	startYear: config.startYear,
	endYear: config.endYear,

	initialize: function(options) {
		this.options = options;

		this.render();

		this.collection = new Backbone.Collection();
		this.collection.url = 'regering.json';
		this.collection.on('reset', this.renderGraph, this);
		this.collection.fetch({
			reset: true
		});
	},

	renderGraph: function() {
		var app = this;

		this.graphWidth = this.$el.parent().width();

		this.xRangeValues = _.map(this.collection.models, function(model) {
			return model.get('from').substr(0, 4);
		});

		if (this.collection.length > 1) {
			this.collection.each(_.bind(function(model) {
				this.xRangeValues = _.union(
					this.xRangeValues, 
					_.map(this.collection.at(1).get('buckets'), function(bucket) {
						return bucket.key_as_string.substr(0, 4);
					})
				);
			}, this));
			this.xRangeValues = this.xRangeValues.sort();
		}

		this.xRange = d3.scale.linear().range([this.graphMargins.left, this.graphWidth - this.graphMargins.right]).domain([config.startYear, config.endYear]);

		this.vis.selectAll('rect')
			.data(this.collection.models)
			.enter()
			.append('rect')
			.attr('x', function (d) {
				return app.xRange(Number(d.get('from').substr(0, 4)))-1;
			})
			.attr('y', 0)
			.attr('width', function (d) {
				return app.xRange(Number(d.get('to').substr(0, 4)))-(app.xRange(Number(d.get('from').substr(0, 4))))+1;
			})
			.attr('height', this.graphHeight)
			.style('fill', _.bind(function(d) {
				return this.colors[d.get('code')];
			}, this))
			;

		this.vis.selectAll('text')
			.data(this.collection.models)
			.enter()
			.append('text')
			.attr('x', function (d) {
				return app.xRange(Number(d.get('from').substr(0, 4)))+8;
			})
			.attr('y', 18)
			.text(function(d) {
				return d.get('code');
			})
			.style('fill', '#666')
			.style('font-size', '12px')
			;

		this.trigger('renderGraph');
	},

	render: function() {
		this.vis = d3.select('#regeringChartContainer');

		window.onresize = _.bind(function() {
			if (this.collection.length > 0) {
//				this.renderGraph();
			}
		}, this);
	}
});
