var Backbone = require('backbone');
var _ = require('underscore');
var ListItemModel = require('./../models/ListItemModel');

module.exports = Backbone.Collection.extend({
	model: ListItemModel,

	url: 'https://ppd-ngin.dh.gu.se/motioner/hits',

	search: function(query, timeRange, queryMode) {
		this.pageIndex = 0;
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
	},

	filtersToString: function(filters) {
		if (filters && filters.length > 0) {		
			var filterStrings = _.map(filters, function(filter) {
				var filterString = '';
				for (var name in filter) {
					filterString += name+':('+(filter[name].join(','))+')';
				}
				return filterString;
			});

			return filterStrings.join(' ');
		}
		else {
			return '';
		}
	},

	addPage: function(resultIndex) {
		if (this.at(resultIndex).get('from_index')+20 < this.at(resultIndex).get('total_hit_count')) {
			
			this.at(resultIndex).set('from_index', this.at(resultIndex).get('from_index')+20);
			this.searchData.fromIndex = this.at(resultIndex).get('from_index');

			var tempCollection = new Backbone.Collection();
			tempCollection.model = ListItemModel;
			tempCollection.url = this.url;
			tempCollection.on('reset', _.bind(function()  {
				this.at(resultIndex).set('hits', _.union(this.at(resultIndex).get('hits'), tempCollection.at(0).get('hits')));

				this.trigger('hitsupdate');
			}, this));

			var searchData = {
				searchPhrase: this.at(resultIndex).get('search_query')+this.at(resultIndex).filtersToString(true),
				startDate: this.searchData.startDate,
				endDate: this.searchData.endDate,
				queryMode: this.searchData.queryMode,
				fromIndex: this.searchData.fromIndex
			};

			tempCollection.fetch({
				data: searchData,
				reset: true
			});
		}
	}
});
