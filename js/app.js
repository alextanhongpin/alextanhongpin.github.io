'use strict';
/*global $, JST, App */
    

var App = App || {};


window.addEventListener('resize', resize, false);
function resize(evt) {

    var list = $('nav').find('li');
    if (!$('.menu').is(':visible')) {
        list.css({
            display: 'inline-block',
            transition: '.3s all ease-out'
        });
    } else {
        list.css({
            display: 'none',
            transition: 'none'
        });
    }
}

App.NavBarView = Backbone.View.extend({
	tagName: 'nav',
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
		'click a': 'link',
        'click .menu': 'toggleMenu'
	},
	link: function (evt) {
        $('nav li').removeClass('active');
        $(evt.target).parent().addClass('active');
		this.nav($(evt.target).attr('href'), {trigger: true});
        
        if ($('.menu').is(':visible')) {
            $(this.el).find('li').hide();
        }
        return false;
	},
    toggleMenu: function (evt) {
        var list = $(this.el).find('li');
        if (list.is(':visible')) {
            list.hide();
        } else {
            list.css('display', 'block');
        }

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

App.PartialPhotographyView = App.DefaultView.extend({
    className: 'album',
    template: JST._photography,
    initialize: function (options) {
        this.nav = options.nav;
    },
    events: {
        'click a': 'link'
    },
    link: function (evt) {
		this.nav($(evt.target).attr('href'), {trigger: true});
        return false;
	},
});
App.PhotographyView = App.DefaultView.extend({
    className: 'photography-view',
    template: JST.photography,
    initialize: function (options) {
        this.timeout = null;
        this.nav = options.nav;
        this.count = options.count;
    },
    events: {
        'click .close': 'closeGallery',
        'click img': 'openGallery',
        'mousemove .gallery': 'showControls',
        'click .gallery': 'toggleControls',
        'click .preview': 'ignoreEvent',
        'click .preview > div': 'displayImage',
        'click a': 'link'
    },
    
    render: function (evt) {
        this.el.innerHTML = this.template({
            count: this.count
        });
        return this;
    },
    
    ignoreEvent: function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
        if (this.timeout) {
                window.clearTimeout(this.timeout);
            };
        return false;
    },
    
    link: function (evt) {
		this.nav($(evt.target).attr('href'), {trigger: true});
        return false;
	},
    
    displayImage: function (evt) {
        evt.stopPropagation();
        var index = $(evt.target).index();
        
        var img = $(this.el).find('img').eq(index);
        var imgSrc = img.attr('src');
        var imgDesc = img.next().text();
        var imgLength = $(this.el).find('img').length;
        var imgSelected = 'Image ' + (index + 1) + ' of ' + imgLength + ' selected.  |  ';
        $('.gallery .desc').html(imgSelected + imgDesc);
        $('.gallery').css('background-image', 'url(' + imgSrc + ')')
    },
    toggleControls: function (evt) {
        evt.stopPropagation();
        $('.info, .close').fadeToggle();
        
        
        if ($('.info, .close').is(':visible')) {
            if (this.timeout) {
                window.clearTimeout(this.timeout);
            };
            this.timeout = window.setTimeout(function () {
                $('.info, .close').fadeOut();
                window.clearTimeout(this.timeout);
            }.bind(this), 3000);
        }
        
    },
    showControls: function (evt) {
        
        $('.info, .close').fadeIn();
        if (this.timeout) {
            window.clearTimeout(this.timeout);
        };
        this.timeout = window.setTimeout(function () {
            $('.info, .close').fadeOut();
            window.clearTimeout(this.timeout);
        }.bind(this), 3000);
    },
    
    closeGallery: function (evt) {
        $('body').removeClass('overflow');
        $('.gallery').fadeOut().css('background-image', null);
    },
    
    openGallery: function (evt) {
        $('body').addClass('overflow');
        var index = $(evt.target).parent().index('.col-8');
        var imgSrc = $(evt.target).attr('src');
        var imgDesc = $(evt.target).next().text();
        var imgLength = $(this.el).find('img').length;
        
        var imgSelected = 'Image ' + (index + 1) + ' of ' + imgLength + ' selected. | ';
        $('.gallery .desc').html(imgSelected + imgDesc);
        $('.gallery').css('background-image', 'url(' + imgSrc + ')').fadeIn();
    },
    
    loadImages: function (data) {
        
        // christmas Market
        var pathToImg = '../../img/photography/';
        var pathToFolder = data.folderPath;
        var space = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
        
        var imgData = data.images;
        var camera = data.camera;
        for (var i = 0; i < imgData.length; i++){
            (function(i) {
                var img = new Image();

                img.onload = function (evt) {
                    $('.photography-view img').eq(i).attr('src' , img.src);
                    console.log(img.src)
                    $('.photography-view img + span').eq(i).html(camera.model + space + imgData[i].dof + space + imgData[i].shutterSpeed + space + imgData[i].iso + space + camera.focalLength);
                    $('.gallery .info .preview div').eq(i).css('background-image', 'url(' + img.src + ')');
                }
                img.onerror = function (err) {
                    alert(err)
                }
                img.src = pathToImg + pathToFolder + imgData[i].name;
            })(i); 
        }

    
    } // end of loadImages();
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
        'photography': 'photography',
        'photography/:album': 'album',
        'programming': 'codes'
	},
	index: function () {
		this.main.hide();
		var pv = new App.ProfileView();
		this.main.html(pv.render().el);
		this.main.fadeIn();
	},
    books: function () {
        this.main.hide();
		var bv = new App.BooksView();
		this.main.html(bv.render().el);
		this.main.fadeIn();
	},
    
	codes: function () {
        this.main.hide();
		var cv = new App.CodesView();
		this.main.html(cv.render().el);
		this.main.fadeIn();
	},
	drawing: function () {
		this.main.hide();
		var dv = new App.DrawingView();
		this.main.html(dv.render().el);
		this.main.fadeIn();
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
        this.main.fadeIn();
        
        $('img').hover(function () {
	    	$(this).next().css('color', '#222');
	    }, function () {
	    	$(this).next().css('color', '#fff');
	    });
    },
    photography: function () {
        this.main.hide();
		var pv = new App.PartialPhotographyView({
            nav: this.nav
        });
		this.main.html(pv.render().el);
		this.main.fadeIn();
    },
    
    album: function (album) {
        // christmas market: 13
        // malaysia: 18
        var data = null;
            
        
        if (album == 'christmas-market') {
            data = {
                folderPath: '01-christmas_market/DSCF2',
                images: [
                    {name: '043.JPG', dof:'f/1.4', shutterSpeed:'1/220 sec',iso:'iso-200'},
                    {name: '046.JPG', dof:'f/1.4', shutterSpeed:'1/480 sec',iso:'iso-200'},
                    {name: '050.JPG', dof:'f/1.4', shutterSpeed:'1/160 sec',iso:'iso-200'},
                    {name: '052.JPG', dof:'f/1.4', shutterSpeed:'1/450 sec',iso:'iso-200'},
                    {name: '054.JPG', dof:'f/1.4', shutterSpeed:'1/52 sec',iso:'iso-320'},

                    {name: '055.JPG', dof:'f/1.4', shutterSpeed:'1/56 sec',iso:'iso-200'},
                    {name: '057.JPG', dof:'f/1.4', shutterSpeed:'1/70 sec',iso:'iso-200'},
                    {name: '058.JPG', dof:'f/1.4', shutterSpeed:'1/52 sec',iso:'iso-200'},
                    {name: '059.JPG', dof:'f/1.4', shutterSpeed:'1/70 sec',iso:'iso-200'},
                    {name: '078.JPG', dof:'f/1.4', shutterSpeed:'1/52 sec',iso:'iso-2500'},

                    {name: '088.JPG', dof:'f/1.4', shutterSpeed:'1/52 sec',iso:'iso-2500'},
                    {name: '095.JPG', dof:'f/1.4', shutterSpeed:'1/52 sec',iso:'iso-3200'},
                    {name: '104.JPG', dof:'f/1.4', shutterSpeed:'1/52 sec',iso:'iso-2000'},
                ],
                camera: {
                    model: 'Fujifilm XE-1',
                    focalLength: '35 mm'
                }
            }
        }
        if (album == 'malaysia') {
            data = {
                folderPath: '02-malaysia/DSCF2',
                images: [
                    {name: '336.JPG', dof:'f/3.2', shutterSpeed:'1/3000 sec',iso:'iso-200'},
                    {name: '342.JPG', dof:'f/2.8', shutterSpeed:'1/4000 sec',iso:'iso-200'},
                    {name: '346.JPG', dof:'f/2.8', shutterSpeed:'1/300 sec',iso:'iso-800'},
                    {name: '348.JPG', dof:'f/2.8', shutterSpeed:'1/90 sec',iso:'iso-400'},
                    {name: '351.JPG', dof:'f/2.8', shutterSpeed:'1/160 sec',iso:'iso-100'},

                    {name: '353.JPG', dof:'f/2.8', shutterSpeed:'1/56 sec',iso:'iso-100'},
                    {name: '363.JPG', dof:'f/2.8', shutterSpeed:'1/1900 sec',iso:'iso-800'},
                    {name: '366.JPG', dof:'f/1.4', shutterSpeed:'1/3500 sec',iso:'iso-200'},
                    {name: '368.JPG', dof:'f/1.4', shutterSpeed:'1/180 sec',iso:'iso-800'},
                    {name: '370.JPG', dof:'f/1.4', shutterSpeed:'1/2200 sec',iso:'iso-800'},

                    {name: '373.JPG', dof:'f/1.4', shutterSpeed:'1/2400 sec',iso:'iso-400'},
                    {name: '379.JPG', dof:'f/1.4', shutterSpeed:'1/1400 sec',iso:'iso-200'},
                    {name: '381.JPG', dof:'f/1.4', shutterSpeed:'1/90 sec',iso:'iso-800'},
                    {name: '415.JPG', dof:'f/13', shutterSpeed:'1/2400 sec',iso:'iso-800'},
                    {name: '423.JPG', dof:'f/1.4', shutterSpeed:'1/550 sec',iso:'iso-800'},

                    {name: '424.JPG', dof:'f/1.4', shutterSpeed:'1/1100 sec',iso:'iso-200'},
                    {name: '425.JPG', dof:'f/1.4', shutterSpeed:'1/1000 sec',iso:'iso-200'},
                    {name: '426.JPG', dof:'f/1.4', shutterSpeed:'1/900 sec',iso:'iso-200'}
                ],
                camera: {
                    model: 'Fujifilm XE-1',
                    focalLength: '35 mm'
                }
            }
            
        }
        
        if (album == 'danboard') {
        
            data = {
                folderPath: '06-danboard/IMG_',
                images: [
                    {name: '4735.jpg', dof:'f/2.8', shutterSpeed:'1/50 sec',iso:'iso-1600'},
                    {name: '2630.jpg', dof:'f/2.8', shutterSpeed:'1/20 sec',iso:'iso-800'},
                    {name: '2641.jpg', dof:'f/2.8', shutterSpeed:'1/20 sec',iso:'iso-800'},
                    {name: '3166.jpg', dof:'f/5', shutterSpeed:'1/60 sec',iso:'iso-200'},

                    {name: '3171.jpg', dof:'f/3.5', shutterSpeed:'1/125 sec',iso:'iso-200'},
                    {name: '3174.jpg', dof:'f/5', shutterSpeed:'1/125 sec',iso:'iso-200'},
                    {name: '3175.jpg', dof:'f/5', shutterSpeed:'1/80 sec',iso:'iso-200'},
                    {name: '3619.jpg', dof:'f/3.5', shutterSpeed:'1/60 sec',iso:'iso-100'},

                ],
                camera: {
                    model: 'Canon EOS 600D',
                    focalLength: '100 mm'
                }
            }
            
        }
        
        if (album == 'preiser-figure') {
            data = {
                folderPath: '07-preiser_figure/',
                images: [
                    {name: '01.jpg', dof:'f/2.8', shutterSpeed:'1/5 sec',iso:'iso-100'},
                    {name: '02.jpg', dof:'f/8', shutterSpeed:'2 sec',iso:'iso-100'},
                    {name: '03.jpg', dof:'f/5.6', shutterSpeed:'4 sec',iso:'iso-100'},
                    {name: '04.jpg', dof:'f/5.6', shutterSpeed:'2.5 sec',iso:'iso-100'},
                    {name: '05.jpg', dof:'f/2.8', shutterSpeed:'4 sec',iso:'iso-100'},

                    {name: '06.jpg', dof:'f/2.8', shutterSpeed:'1/30 sec',iso:'iso-400'},
                    {name: '07.jpg', dof:'f/4', shutterSpeed:'1/30 sec',iso:'iso-100'},
                    {name: '08.jpg', dof:'f/2.8', shutterSpeed:'1/4 sec',iso:'iso-100'},
                    {name: '09.jpg', dof:'f/11', shutterSpeed:'2 sec',iso:'iso-400'},
                    {name: '10.jpg', dof:'f/2.8', shutterSpeed:'1/5 sec',iso:'iso-100'},


                ],
                camera: {
                    model: 'Canon EOS 600D',
                    focalLength: '100 mm'
                }
            }
        }
        
        if (album == 'berlin') {
            data = {
                folderPath: '05-berlin_trip/',
                images: [
        {
          "name": "DSCF2607.JPG",
          "iso": 200,
          "shutterSpeed": "1/1663",
          "dof": 1.4,
        },
        {
          "name": "DSCF2608.JPG",
          "iso": 200,
          "shutterSpeed": "1/739",
          "dof": 1.4,
        },
        {
          "name": "DSCF2609.JPG",
          "iso": 200,
          "shutterSpeed": "1/1038",
          "dof": 1.4,
        },
        {
          "name": "DSCF2611.JPG",
          "iso": 200,
          "shutterSpeed": "1/600",
          "dof": 1.4,
        },
        {
          "name": "DSCF2616.JPG",
          "iso": 200,
          "shutterSpeed": "1/729",
          "dof": 1.4,
        },
        {
          "name": "DSCF2619.JPG",
          "iso": 320,
          "shutterSpeed": "1/64",
          "dof": 8.0,
          
       
        },
        {
          "name": "DSCF2626.JPG",
          "iso": 800,
          "shutterSpeed": "1/38",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2634.JPG",
          "iso": 800,
          "shutterSpeed": "1/64",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2637.JPG",
          "iso": 800,
          "shutterSpeed": "1/23",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2650.JPG",
          "iso": 800,
          "shutterSpeed": "1/53",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2656.JPG",
          "iso": 200,
          "shutterSpeed": "1/676",
          "dof": 8.9,
          
       
        },
        {
          "name": "DSCF2658.JPG",
          "iso": 200,
          "shutterSpeed": "1/588",
          "dof": 10.9,
          
       
        },
        {
          "name": "DSCF2659.JPG",
          "iso": 200,
          "shutterSpeed": "1/2091",
          "dof": 4.0,
          
       
        },
        {
          "name": "DSCF2660.JPG",
          "iso": 200,
          "shutterSpeed": "1/2353",
          "dof": 4.0,
          
       
        },
        {
          "name": "DSCF2666.JPG",
          "iso": 200,
          "shutterSpeed": "1/143",
          "dof": 10.9,
          
       
        },
        {
          "name": "DSCF2667.JPG",
          "iso": 200,
          "shutterSpeed": "1/1859",
          "dof": 3.2,
          
       
        },
        {
          "name": "DSCF2668.JPG",
          "iso": 200,
          "shutterSpeed": "1/111",
          "dof": 10.9,
          
       
        },
        {
          "name": "DSCF2670.JPG",
          "iso": 200,
          "shutterSpeed": "1/3126",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2671.JPG",
          "iso": 320,
          "shutterSpeed": "1/64",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2673.JPG",
          "iso": 200,
          "shutterSpeed": "1/4096",
          "dof": 1.6,
          
       
        },
        {
          "name": "DSCF2685.JPG",
          "iso": 200,
          "shutterSpeed": "1/1226",
          "dof": 4.0,
          
       
        },
        {
          "name": "DSCF2690.JPG",
          "iso": 200,
          "shutterSpeed": "1/792",
          "dof": 4.0,
          
       
        },
        {
          "name": "DSCF2695.JPG",
          "iso": 200,
          "shutterSpeed": "1/653",
          "dof": 4.0,
          
       
        },
        {
          "name": "DSCF2696.JPG",
          "iso": 200,
          "shutterSpeed": "1/724",
          "dof": 4.0,
          
       
        },
        {
          "name": "DSCF2697.JPG",
          "iso": 200,
          "shutterSpeed": "1/1252",
          "dof": 4.0,
          
       
        },
        {
          "name": "DSCF2700.JPG",
          "iso": 200,
          "shutterSpeed": "1/105",
          "dof": 4.0,
          
       
        },
        {
          "name": "DSCF2702.JPG",
          "iso": 200,
          "shutterSpeed": "1/1458",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2729.JPG",
          "iso": 800,
          "shutterSpeed": "1/20",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2730.JPG",
          "iso": 800,
          "shutterSpeed": "1/24",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2733.JPG",
          "iso": 200,
          "shutterSpeed": "1/241",
          "dof": 10.9,
          
       
        },
        {
          "name": "DSCF2738.JPG",
          "iso": 200,
          "shutterSpeed": "1/64",
          "dof": 8.0,
          
       
        },
        {
          "name": "DSCF2741.JPG",
          "iso": 200,
          "shutterSpeed": "1/69",
          "dof": 8.0,
          
       
        },
        {
          "name": "DSCF2743.JPG",
          "iso": 200,
          "shutterSpeed": "1/428",
          "dof": 8.0,
          
       
        },
        {
          "name": "DSCF2755.JPG",
          "iso": 200,
          "shutterSpeed": "1/1438",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2756.JPG",
          "iso": 200,
          "shutterSpeed": "1/152",
          "dof": 1.6,
          
       
        },
        {
          "name": "DSCF2760.JPG",
          "iso": 200,
          "shutterSpeed": "1/229",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2763.JPG",
          "iso": 200,
          "shutterSpeed": "1/1629",
          "dof": 1.6,
          
       
        },
        {
          "name": "DSCF2767.JPG",
          "iso": 400,
          "shutterSpeed": "1/64",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2771.JPG",
          "iso": 200,
          "shutterSpeed": "1/256",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2775.JPG",
          "iso": 320,
          "shutterSpeed": "1/64",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2776.JPG",
          "iso": 320,
          "shutterSpeed": "1/64",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2777.JPG",
          "iso": 500,
          "shutterSpeed": "1/64",
          "dof": 1.4,
          
       
        },
        {
          "name": "DSCF2778.JPG",
          "iso": 400,
          "shutterSpeed": "1/64",
          "dof": 1.4,
          
       
        }],
                camera: {
                    model: 'Fujifilm XE-1',
                    focalLength: '35.0mm',
                    lensModel: "XF35mmF1.4 R"
                }
            }
        }
        
        
            this.main.hide();
            var pv = new App.PhotographyView({
                nav: this.nav,
                count: data.images.length 
            });
            this.main.html(pv.render().el);
            this.main.fadeIn();
        pv.loadImages(data);
        
        
    },
    
 	guitar: function () {
        this.main.hide();
		var gpv = new App.GuitarPageView();
		this.main.html(gpv.render().el);
		this.main.fadeIn();
	},
	resume: function () {
		this.main.hide();
		var rv = new App.ResumeView();
		this.main.html(rv.render().el);
		this.main.fadeIn('slow');
		
		this.main.append('<h3 style="padding:80px;"><b>*to be updated*</b></h3>');
		// screen reader with max 160 characters. when you scroll donw it will form new words from the previous alphabets
	}
});
    