'use strict';
/*global $, JST, App */
    

var App = App || {};



function resize() {
	if ($(window).height() >= $(document).height()) {
		var newHeight = window.innerHeight - $('footer').height() - 2 * parseInt($('footer').css('padding')) - 2 * parseInt($('body').css('padding')) - $('ul').height() - 2 * parseInt($('ul').css('padding'));
		$('#main').css({'height': newHeight});
	} else {
		$('#main').css({'height': '100%'});
	}
    $('.intro').css({
        'font-size': window.innerWidth / 15
    }).next().css({'text-align': 'left'});
}


App.NavBarView = Backbone.View.extend({
	tagName: 'ul',
	template: JST.navbar,
	render: function () {
		this.el.innerHTML = this.template();
		this.$el.find('li').hover(function () {
			$('li a').not($(this).children('a')).css({'-webkit-filter': 'blur(2px)'});
		}, function () {
			$('li a').css({'-webkit-filter': 'blur(0px)'});
		});
		return this;
	},
	events: {
		'click a': 'link'
	},
	link: function (e) {
		e.preventDefault();
		appRouter.navigate($(e.target).attr('href'), {trigger: true});
	}
});

App.ProfileView = Backbone.View.extend({
	className: 'col-10',
	template: JST.profile,
	render: function () {
		this.el.innerHTML = this.template();
		return this;
	}
});


App.BooksView = Backbone.View.extend({
	template: JST.books,
	render: function () {
		this.el.innerHTML = this.template();
		return this;
	}
});

App.CodesView = Backbone.View.extend({
	template: JST.programming,
	render: function () {
		this.el.innerHTML = this.template();
		return this;
	}
});

App.GuitarPageView = Backbone.View.extend({
	template: JST.guitar,
	render: function () {
		this.el.innerHTML = this.template();
		return this;
	}
});

App.ResumeView = Backbone.View.extend({
	className: 'col-10',
	template: JST.resume,
	render: function () {
		this.el.innerHTML = this.template();
		return this;
	}
});

App.DrawingView = Backbone.View.extend({
	template: JST.drawing,
	render: function () {
		this.el.innerHTML = this.template();
	    
		return this;
	}
});
App.Router = Backbone.Router.extend({
	initialize: function (options) {
		this.main = options.main;
		this.body = options.body;
		var nbv = new App.NavBarView();
		$(nbv.render().el).insertBefore(this.main);
	},
	root: '/',
	routes: {
		'': 'index',
        'books': 'books',
		'codes': 'codes',
		'guitar': 'guitar',
		'resume': 'resume',
		'drawing': 'drawing',
        'programming': 'codes'
	},
	index: function () {
		this.main.hide();
		var pv = new App.ProfileView();
		this.main.html(pv.render().el);
		this.main.fadeIn('slow', resize);
	},
    books: function () {
        this.main.hide();
		var bv = new App.BooksView();
		this.main.html(bv.render().el);
		this.main.fadeIn('slow', resize);
	},
    
	codes: function () {
        this.main.hide();
		var cv = new App.CodesView();
		this.main.html(cv.render().el);
		this.main.fadeIn('slow', resize);
	},
	drawing: function () {
		this.main.hide();
		var dv = new App.DrawingView();
		this.main.html(dv.render().el);
		this.main.fadeIn('slow', resize);
	    $('img').hover(function () {
	    	$(this).next().css('color', '#222');
	    }, function () {
	    	$(this).next().css('color', '#fff');
	    });
        
	},
	guitar: function () {
        this.main.hide();
		var gpv = new App.GuitarPageView();
		this.main.html(gpv.render().el);
		this.main.fadeIn('slow', resize);
	},
	resume: function () {
		this.main.hide();
		var rv = new App.ResumeView();
		this.main.html(rv.render().el);
		this.main.fadeIn('slow', resize);
		
		this.main.append('<h3 style="padding:80px;"><b>*to be updated*</b></h3>');
		
	}
});
    