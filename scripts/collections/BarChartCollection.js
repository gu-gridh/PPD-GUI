var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');

module.exports = Backbone.Collection.extend({
	url: 'https://ppd-ngin.dh.gu.se/motioner/barchart/parties',
	includeTotal: false,

	initialize: function() {
	},

	parse: function(data) {
		return data.data;
	},

	search: function(query, timeRange, queryMode) {
		this.searchData = {
			'searchPhrase': query,
			'startDate': timeRange[0],
			'endDate': timeRange[1],
			'queryMode': queryMode == null ? 'exact' : queryMode
		};

		this.fetch({
			reset: true,
			data: this.searchData
		});
	}
});
