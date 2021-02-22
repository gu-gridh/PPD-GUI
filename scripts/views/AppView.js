var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');

var SearchInputView = require('./SearchInputView');
var AppRouter = require('./../router/AppRouter');
var NgramView = require('./NgramView');
var RegeringView = require('./RegeringView');
var SliderView = require('./SliderView');
var ListView = require('./ListView');
var config = require('../../config');

module.exports = Backbone.View.extend({
	parties: [
		{
			letter: 's',
			color: '#ed1b34',
			name: 'Socialdemokraterna',
			logo: 'partylogo-s.png',
			entity: '&#xe90a;'
		},
		{
			letter: 'm',
			color: '#52bdec',
			name: 'Moderata samlingspartiet',
			logo: 'partylogo-m.png',
			entity: '&#xe907;'
		},
		{
			letter: 'c',
			color: '#016a3a',
			name: 'Centerpartiet',
			logo: 'partylogo-c.png',
			entity: '&#xe904;'
		},
		{
			letter: 'fp',
			color: '',
			name: 'Folkpartiet',
			logo: 'partylogo-fp.png',
			entity: '&#xe905;'
		},
		{
			letter: 'kd',
			color: '#073192',
			name: 'Kristdemokraterna',
			logo: 'partylogo-kd.png',
			entity: '&#xe906;'
		},
		{
			letter: 'v',
			color: '#da291c',
			name: 'Vänsterpartiet',
			logo: 'partylogo-v.png',
			entity: '&#xe90c;'
		},
		{
			letter: 'mp',
			color: '#53a045',
			name: 'Miljöpartiet de gröna',
			logo: 'partylogo-mp.png',
			entity: '&#xe908;'
		},
		{
			letter: 'vpk',
			color: '',
			name: 'Vänsterpartiet Kommunisterna'
		},
		{
			letter: 'sd',
			color: '#fbc700',
			name: 'Sverigedemokraterna ',
			logo: 'partylogo-sd.png',
			entity: '&#xe90b;'
		},
		{
			letter: 'kds',
			color: '',
			name: 'Kristen demokratisk samling'
		},
		{
			letter: 'nyd',
			color: '',
			name: 'Ny Demokrati',
			logo: 'partylogo-nyd.png',
			entity: '&#xe909;'
		},
		{
			letter: 'l',
			color: '#004b92',
			name: 'Liberalerna'
		},
		{
			letter: 'apk',
			color: '',
			name: 'Arbetarpartiet kommunisterna'
		},
		{
			letter: 'ni',
			color: '',
			name: ''
		},
		{
			letter: 'i',
			color: '',
			name: ''
		},
		{
			letter: 'kr',
			color: '',
			name: ''
		},
		{
			letter: 'bör',
			color: '',
			name: ''
		},
		{
			letter: 'in',
			color: '',
			name: ''
		},
		{
			letter: 'rn',
			color: '',
			name: ''
		},
		{
			letter: 'vp',
			color: '',
			name: 'Vänsterpartiet'
		},
		{
			letter: 'e',
			color: '',
			name: ''
		},
		{
			letter: 'nt',
			color: '',
			name: ''
		},
		{
			letter: 'tn',
			color: '',
			name: ''
		},
		{
			letter: 'a',
			color: '',
			name: ''
		},
		{
			letter: '0',
			color: '',
			name: ''
		}
	],

	startYear: config.startYear,
	endYear: config.endYear,

	initialize: function() {
		this.router = new AppRouter();

		this.render();

		this.router.on('route:default', _.bind(function(query) {
			$(document.body).removeClass('search-mode');
		}, this));

		this.router.on('route:view', _.bind(function(document) {
		}, this));

		this.router.on('route:search', _.bind(function(query, queryMode, yearFrom, yearTo, document) {
			$('html').removeClass('has-overlay');
			$('#textViewer').removeClass('visible');
			this.search(query, queryMode, yearFrom == null ? this.startYear : yearFrom, yearTo == null ? this.endYear : yearTo);
		}, this));

		Backbone.history.start();
	},

	search: function(query, queryMode, yearFrom, yearTo) {
		this.colorRegistry = [];

		$(document.body).addClass('search-mode');

		if (!this.sliderView) {
			this.initSlider();
		}

		if (this.ngramView == undefined) {
			this.ngramView = new NgramView({
				el: this.$el.find('#ngramContianer'),
				percentagesView: true,
				app: this
			});
			this.ngramView.on('updategraph', this.onNgramUpdate, this);
			this.ngramView.on('graphclick', _.bind(function(event) {
				this.sliderView.setSliderValues([event.year, event.year+1], true);
			}, this));
			this.ngramView.on('timerange', _.bind(function(event) {
				this.sliderView.setSliderValues([event.values[0], event.values[1]], true);
			}, this));
			this.ngramView.on('wildcardresults', _.bind(function() {
				this.hitList.search(_.first(_.map(this.ngramView.collection.models, function(model) {
					return model.get('key')+(model.get('filters') && model.get('filters')[0] && model.get('filters')[0].parti ? ' parti:('+model.get('filters')[0].parti[0]+')' : '');
				}), 4).join(','), [yearFrom, yearTo], queryMode);
			}, this));
		}

		if (this.ngramView.lastQuery != query || this.ngramView.lastQueryMode != queryMode) {
			this.ngramView.search(query, queryMode);
		}

		if (this.regeringView == undefined) {
			this.regeringView = new RegeringView({
				el: this.$el.find('#regeringViewContainer')
			});
		}

		if (this.hitList == undefined) {
			this.hitList = new ListView({
				el: this.$el.find('#hitlistContainer'),
				router: this.router,
				parties: this.parties,
				app: this
			});
		}

		if (this.searchInput.getQueryString() != query) {
			this.searchInput.resetQueryItems(query);
		}

		if (query != this.hitList.lastQuery || queryMode != this.hitList.lastQueryMode || (yearFrom != this.hitList.timeRange[0] || yearTo != this.hitList.timeRange[1])) {
			/*
				When updating the search, we have to ckeck if we are making a wildcard search or not.
			*/

			var searchTerms = query.split(/(?![^)(]*\([^)(]*?\)\)),(?![^\(]*\))/g);

			if (this.ngramView.wildcardSearch && searchTerms[0].split(' parti:(')[0].indexOf('*') > -1) {

				// Update hitlist based on wildcard results fron the ngramView
				this.hitList.search(_.first(_.map(this.ngramView.collection.models, function(model) {
					return model.get('key')+(model.get('filters') && model.get('filters')[0] && model.get('filters')[0].parti ? ' parti:('+model.get('filters')[0].parti[0]+')' : '');
				}), 4).join(','), [yearFrom, yearTo], queryMode);
			}
			else {
				this.hitList.search(query, [yearFrom, yearTo], queryMode);
			}
		}

		if (this.sliderView.sliderValues[0] != yearFrom || this.sliderView.sliderValues[1] != yearTo) {
			this.sliderView.setSliderValues([yearFrom, yearTo]);
			this.ngramView.setTimeOverlay([yearFrom, yearTo]);
		}

		if (this.searchInput.getQueryMode() != queryMode) {
			this.searchInput.setQueryMode(queryMode);
		}
	},

	onNgramUpdate: function() {
	},

	colors: ['#00cc88', '#8fb300', '#8c5e00', '#290099', '#0a004d', '#00590c', '#002233', '#e55c00', '#4c1400', '#006680', '#8f00b3', '#8c005e', '#ffcc00', '#36cc00', '#004b8c', '#ff0066', '#002459', '#732e00', '#00a2f2', '#00becc', '#ff00ee', '#00330e', '#003de6', '#73001f', '#403300', '#b20000', '#40001a', '#005953'],
	colorRegistry: [],

	createColorRegistry: function(models, key) {
		this.colorRegistry = _.map(models, _.bind(function(model, index) {
			return {
				key: model.get(key != undefined ? key : 'search_query')+(model.get('filters') && model.get('filters')[0] && model.get('filters')[0].parti ? ' parti:('+(
					model.get('filters')[0].parti.join(',')
				)+')' : ''),
				color: this.colors[index]
			}
		}, this));
	},

	getItemColor: function(key) {
		return _.find(this.colorRegistry, function(color) {
			return color.key == key;
		}).color;
	},

	initSlider: function() {
		this.sliderView = new SliderView({
			el: this.$el.find('#sliderContainer'),
			range: [config.startYear, config.endYear]
		});
		this.sliderView.on('change', _.bind(function(event) {
			this.router.navigate('search/'+this.searchInput.getQueryString()+(this.searchInput.getQueryMode() != 'exact' ? '/querymode/'+this.searchInput.getQueryMode() : '')+'/'+event.values[0]+'/'+event.values[1], {
				trigger: true
			});
		}, this));
		this.sliderView.on('slide', _.bind(function(event) {
			this.ngramView.setTimeOverlay(event.values);
		}, this));
	},

	render: function() {
		this.searchInput = new SearchInputView({
			el: this.$el.find('#searchInput'),
			parties: this.parties
		});

		this.searchInput.on('search', _.bind(function(event) {
			this.router.navigate('search/'+event.queryString+(event.queryMode != 'exact' ? '/querymode/'+event.queryMode : ''), {
				trigger: true
			});
		}, this));
		return this;
	}
});
