function initialize()
    {
        var myCenter = new google.maps.LatLng(49.488607, 8.466370);
        var mapProp = {
            center: myCenter, 
            zoom: 7,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI : true
        };
        var map = new google.maps.Map(document.getElementById("googleMap"),mapProp);

        var marker = new google.maps.Marker({
            position: myCenter
        });
        marker.setMap(map);
        
        var infowindow = new google.maps.InfoWindow({
            content: '<p>Hello from Germany!</p>'
        });
        infowindow.open(map,marker);
    }
      
    google.maps.event.addDomListener(window, 'load', initialize);
    google.maps.event.addListener(map,'center_changed',function() {
        window.setTimeout(function() {
            map.panTo(marker.getPosition());
        },3000);
    });
    
