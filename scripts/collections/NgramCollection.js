var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');

module.exports = Backbone.Collection.extend({
	url: 'https://ppd-ngin.dh.gu.se/motioner/timeline/search',
	includeTotal: false,

	initialize: function() {
		this.totalCollection = new Backbone.Collection();
		this.totalCollection.url = 'https://ppd-ngin.dh.gu.se/motioner/timeline/total';
		this.totalCollection.fetch();
	},

	getTotalByYear: function(year) {
		if (this.totalCollection.length == 0) {
			return null;
		}
		return _.filter(this.totalCollection.at(0).get('buckets'), function(bucket) {
			return Number(bucket.key_as_string) == year;
		})[0].doc_count;
	},

	parse: function(data) {
		if (this.includeTotal) {
			data.data.push(this.totalCollection.toJSON()[0]);
		}
		return data.data;
	},

	search: function(query, queryMode) {
		this.queryString = query;

		this.searchData = {
			'searchPhrase': query,
			'queryMode': queryMode == null ? 'exact' : queryMode
		};

		this.fetch({
			data: this.searchData,
			reset: true
		});
	}
});
