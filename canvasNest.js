(function(){
    const requestAnimationFrame = 
        window.requestAnimationFrame || 
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame || 
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||  
        function(func) {
            return window.setTimeout(func, 1000 / 60);
        }; // refresh 60 times per second

    const cancelAnimationFrame = 
        window.cancelAnimationFrame || 
        window.webkitCancelAnimationFrame || 
        window.mozCancelAnimationFrame || 
        window.msCancelAnimationFrame ||
        window.oCancelAnimationFrame ||  
        window.clearTimeout;

    const range = n => new Array(n).fill(0).map((val,idx)=>idx);

    const canvasStyle = config => 
        `display: block;
        z-index:${config.zIndex};
        opacity:${config.opacity};
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
        overflow:hidden;`;


    class nestCanvas {
        constructor(el, config){
            this.el = el;
            this.config = {
                zIndex:-1,
                opacity:0.5,
                color: '0,255,255',
                count: 100,
                ...config
            };

            this.canvas = this.newCanvas();
            this.points = this.randomPoints();
            this.context = this.canvas.getContext('2d');
            this.mousemove = null;
            this.mouseout = null;
            this.current = {
                x:null,
                y:null,
                max:10000
            }
            this.all = this.points.concat([this.current]);

            this.bindEvent();
            this.requestFrame(this.drawCanvas);

        }

        bindEvent(){
            this.onmousemove = window.onmousemove;
            this.onmouseout = window.onmouseout;

            window.onmousemove = (e) =>{
                this.current.x = e.clientX - this.el.offsetLeft + document.scrollingElement.scrollLeft;
                this.current.y = e.clientY - this.el.offsetTop + document.scrollingElement.scrollTop;
                this.onmousemove && this.onmousemove(e);
            }

            window.onmouseout = ()=>{
                this.current.x = null;
                this.current.y = null;
                this.onmouseout && this.onmouseout();
            }
        }

        randomPoints(){
            return range(this.config.count).map(()=>({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                xa: 2 * Math.random() - 1,
                ya: 2 * Math.random() - 1,
                max: 6000
            }));
        }


        newCanvas(){
            if(getComputedStyle(this.el).position == 'static'){
                this.el.style.position = 'relative';
            }
            const canvas = document.createElement('canvas');
            canvas.height = this.el.clientHeight;
            canvas.width = this.el.clientWidth;
            canvas.style.cssText = canvasStyle(this.config);

            this.el.appendChild(canvas);
            return canvas;
        }

        requestFrame(func){
            this.tid = requestAnimationFrame(() => func.call( this));
        }

        drawCanvas(){
            const points = this.points,
                context = this.context,
                width = this.canvas.width,
                height = this.canvas.height,
                config = this.config,
                all = this.all,
                current = this.current;

            context.clearRect(0, 0, width, height);
            points.forEach(function(r,idx){
                r.x += r.xa;
                r.y += r.ya;
                r.xa *= (r.x < 0 || r.x > width) ? -1 : 1;
                r.ya *= (r.y < 0 || r.y > height) ? -1 : 1;

                context.fillRect(r.x - 1, r.y - 1 , 2, 2);

                for(let i = idx+1; i < all.length; i++){
                    let e = all[i];

                    if(e.x == null || e.y == null){
                        continue;
                    }
                    let dist_x = r.x - e.x,
                    dist_y = r.y - e.y,
                    dist = dist_x * dist_x + dist_y * dist_y;
                    
                    if(dist < e.max){
                        if(e === current && dist >= e.max / 2){
                            r.x -= 0.02 * dist_x;
                            r.y -= 0.02 * dist_y;
                        }

                        let d = (e.max - dist) / e.max;
                        context.beginPath();
                        context.moveTo(r.x, r.y);
                        context.lineWidth = d / 2;
                        context.strokeStyle = `rgba(${config.color},${d+0.2})`;
                        context.lineTo(e.x, e.y);
                        context.stroke();
                    }
                }

            })
            
            this.requestFrame(this.drawCanvas);
        }

        destroy(){
            window.onmousemove = this.onmousemove;
            window.onmouseout = this.onmouseout;
            clear(this.el);

            cancelAnimationFrame(this.tid);
            this.el.removeChild(this.canvas);
        }
    }

window.nestCanvas = nestCanvas;

})();