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
}


App.NavBarView = Backbone.View.extend({
	tagName: 'ul',
	template: JST.navbar,
    initialize: function (options) {
        this.nav = options.nav;    
    },
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
	link: function (evt) {
		evt.preventDefault();
		this.nav($(evt.target).attr('href'), {trigger: true});
        return false;
	}
});

App.DefaultView = Backbone.View.extend({
    render: function () {
        this.el.innerHTML = this.template();
        return this;
    }
});

App.ProfileView = App.DefaultView.extend({
	className: 'col-10',
	template: JST.profile
});


App.BooksView = App.DefaultView.extend({
	template: JST.books
});

App.CodesView = App.DefaultView.extend({
	template: JST.programming
});

App.GuitarPageView = App.DefaultView.extend({
	template: JST.guitar
});

App.ResumeView = App.DefaultView.extend({
	className: 'col-10',
	template: JST.resume
});

App.DrawingView = App.DefaultView.extend({
	template: JST.drawing
});

App.ProjectView = App.DefaultView.extend({
    template: JST.project
});
App.Router = Backbone.Router.extend({
	initialize: function (options) {
		this.main = options.main;
		this.body = options.body;
        this.nav = this.navigate.bind(this);
        
		var nbv = new App.NavBarView({
            nav: this.nav
        });
		$(nbv.render().el).insertBefore(this.main);
        
	},
	//root: '/index.html',
	routes: {
		'': 'index',
        'books': 'books',
		'codes': 'codes',
		'guitar': 'guitar',
		'resume': 'resume',
        'project': 'project',
		'drawing': 'drawing',
        'programming': 'codes'
	},
	index: function () {
		this.main.hide();
		var pv = new App.ProfileView();
		this.main.html(pv.render().el);
        resize();
		this.main.fadeIn('slow', resize);
	},
    books: function () {
        this.main.hide();
		var bv = new App.BooksView();
		this.main.html(bv.render().el);
        resize();
		this.main.fadeIn('slow', resize);
	},
    
	codes: function () {
        this.main.hide();
		var cv = new App.CodesView();
		this.main.html(cv.render().el);
        resize();
		this.main.fadeIn('slow', resize);
	},
	drawing: function () {
		this.main.hide();
		var dv = new App.DrawingView();
		this.main.html(dv.render().el);
        resize();
		this.main.fadeIn('slow', resize);
	    $('img').hover(function () {
	    	$(this).next().css('color', '#222');
	    }, function () {
	    	$(this).next().css('color', '#fff');
	    });
        
	},
    project: function () {
        this.main.hide();
        var pv = new App.ProjectView();
        this.main.html(pv.render().el);
        resize();
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
        resize();
		this.main.fadeIn('slow', resize);
	},
	resume: function () {
		this.main.hide();
		var rv = new App.ResumeView();
		this.main.html(rv.render().el);
        resize();
		this.main.fadeIn('slow', resize);
		
		this.main.append('<h3 style="padding:80px;"><b>*to be updated*</b></h3>');
		
	}
});
    