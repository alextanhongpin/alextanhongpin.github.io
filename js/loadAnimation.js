function animate(){

    var status = false;
    var canvas = document.getElementById('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    var context = canvas.getContext('2d');
    
    $(window).resize(function(){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    var time = 0;
    
    function draw(){
        if (status == false){
        context.fillStyle = 'rgba(255,255,255,0.05)';
        context.fillRect(0,0,canvas.width,canvas.height);
        context.fill();
        context.save();
        
        time++;
        if(time > 140){
            status = true;
            $('canvas').fadeOut('slow');
        }
        context.beginPath();
        context.translate(canvas.width/2 + 50 * Math.cos(time/30),canvas.height/2 + 50 * Math.sin(time/30));
        context.arc(0,0,10,0,Math.PI*2);
        context.fillStyle = '#ddd';
        context.fill();
        context.closePath();
        context.restore();
        context.save();
        
        context.beginPath();
        context.translate(canvas.width/2 - 50 * Math.cos(time/30),canvas.height/2 - 50 * Math.sin(time/30));
        context.arc(0,0,10,0,Math.PI*2);
        context.fillStyle = '#222';
        context.fill();
        context.closePath();
        context.restore();
        context.save();
        }
    }
    setInterval(draw, 1000/60);
}