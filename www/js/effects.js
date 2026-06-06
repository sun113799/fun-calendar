// ===== 粒子系统 v9 — 每个主题完全不同 =====
// 主题 → 粒子类型: sakura=花瓣, ocean=气泡⬆, starry=星光, forest=落叶, sunset=金尘, night=萤火
var _effectInstance = null;

function getEffectConfig() {
  var theme = document.documentElement.getAttribute('data-theme') || 'sakura';
  var configs = {
    sakura: {
      count: 30, opacity: 0.6, fallSpeed: 0.35, size: [6,14],
      type: 'petal',
      colors: ['rgba(255,200,210,0.55)','rgba(255,220,230,0.45)','rgba(255,180,195,0.5)','rgba(255,240,245,0.4)'],
    },
    ocean: {
      count: 25, opacity: 0.5, fallSpeed: -0.4, size: [4,12],
      type: 'bubble',
      colors: ['rgba(180,220,255,0.35)','rgba(140,200,245,0.3)','rgba(200,235,255,0.28)','rgba(255,255,255,0.2)'],
    },
    starry: {
      count: 50, opacity: 0.7, fallSpeed: 0.08, size: [2,5],
      type: 'star',
      colors: ['rgba(255,255,220,0.7)','rgba(255,240,200,0.55)','rgba(255,255,255,0.6)','rgba(200,220,255,0.5)'],
    },
    forest: {
      count: 20, opacity: 0.55, fallSpeed: 0.5, size: [5,10],
      type: 'leaf',
      colors: ['rgba(120,180,100,0.45)','rgba(150,200,120,0.4)','rgba(100,160,80,0.42)','rgba(180,210,150,0.35)'],
    },
    sunset: {
      count: 40, opacity: 0.65, fallSpeed: 0.15, size: [1.5,4],
      type: 'sparkle',
      colors: ['rgba(255,200,120,0.65)','rgba(255,180,100,0.55)','rgba(255,220,160,0.5)','rgba(255,255,200,0.45)'],
    },
    night: {
      count: 35, opacity: 0.45, fallSpeed: 0.2, size: [2,5],
      type: 'firefly',
      colors: ['rgba(200,200,220,0.3)','rgba(180,190,210,0.25)','rgba(220,220,240,0.28)','rgba(255,255,255,0.2)'],
    },
  };
  return configs[theme] || configs.sakura;
}

var EffectEngine = (function() {
  function E(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.cfg = getEffectConfig();
    this.resize();
    this.make();
    var self = this;
    window.addEventListener('resize', function() { self.resize(); });
    this.loop();
    _effectInstance = this;
  }
  E.prototype.resize = function() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };
  E.prototype.make = function() {
    this.cfg = getEffectConfig();
    this.particles = [];
    for (var i = 0; i < this.cfg.count; i++) this.particles.push(this.rnd(true));
  };
  E.prototype.rnd = function(sr) {
    var c = this.cfg;
    return {
      x: Math.random() * this.canvas.width,
      y: sr ? Math.random() * this.canvas.height : (c.fallSpeed < 0 ? this.canvas.height + 20 : -30),
      s: Math.random() * (c.size[1] - c.size[0]) + c.size[0],
      vy: (Math.random() * 0.6 + 0.2) * (c.fallSpeed < 0 ? -1 : 1) * (c.fallSpeed ? Math.abs(c.fallSpeed) * 3 : 0.4),
      vx: Math.random() * 0.3 - 0.15,
      r: Math.random() * 360,
      vr: Math.random() * 2 - 1,
      o: Math.random() * 0.3 + 0.15,
      color: c.colors[Math.floor(Math.random() * c.colors.length)],
      ph: Math.random() * Math.PI * 2,
      life: Math.random(),
      twinkle: Math.random() * Math.PI * 2,
    };
  };
  E.prototype.drawPetal = function(p) {
    var ctx = this.ctx;
    ctx.save(); ctx.globalAlpha = p.o;
    ctx.translate(p.x, p.y); ctx.rotate(p.r * Math.PI / 180);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  E.prototype.drawBubble = function(p) {
    var ctx = this.ctx;
    ctx.save(); ctx.globalAlpha = p.o;
    ctx.strokeStyle = p.color; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.stroke();
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.arc(p.x - p.s * 0.3, p.y - p.s * 0.3, p.s * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  E.prototype.drawStar = function(p) {
    var ctx = this.ctx;
    var tw = Math.sin(p.twinkle) * 0.4 + 0.6;
    ctx.save(); ctx.globalAlpha = p.o * tw;
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var angle = i * Math.PI / 2;
      ctx.lineTo(0, -p.s);
      ctx.lineTo(p.s * 0.3, 0);
      ctx.lineTo(0, p.s * 0.5);
      ctx.rotate(Math.PI / 2);
    }
    ctx.fill();
    ctx.restore();
  };
  E.prototype.drawLeaf = function(p) {
    var ctx = this.ctx;
    ctx.save(); ctx.globalAlpha = p.o;
    ctx.translate(p.x, p.y); ctx.rotate(p.r * Math.PI / 180);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -p.s);
    ctx.bezierCurveTo(p.s * 0.6, -p.s * 0.3, p.s * 0.4, p.s * 0.6, 0, p.s);
    ctx.bezierCurveTo(-p.s * 0.4, p.s * 0.6, -p.s * 0.6, -p.s * 0.3, 0, -p.s);
    ctx.fill();
    ctx.restore();
  };
  E.prototype.drawSparkle = function(p) {
    var ctx = this.ctx;
    var tw = Math.sin(p.twinkle) * 0.5 + 0.5;
    ctx.save(); ctx.globalAlpha = p.o * (0.5 + tw * 0.5);
    var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 2);
    grad.addColorStop(0, p.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  E.prototype.drawFirefly = function(p) {
    var ctx = this.ctx;
    var tw = Math.sin(p.twinkle + performance.now() * 0.001) * 0.4 + 0.6;
    ctx.save(); ctx.globalAlpha = p.o * tw;
    var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 1.5);
    grad.addColorStop(0, 'rgba(255,255,255,0.5)');
    grad.addColorStop(0.5, p.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  E.prototype.draw = function(p) {
    var drawFn = {
      petal: this.drawPetal, bubble: this.drawBubble, star: this.drawStar,
      leaf: this.drawLeaf, sparkle: this.drawSparkle, firefly: this.drawFirefly,
    }[this.cfg.type];
    if (drawFn) drawFn.call(this, p);
  };

  E.prototype.updateColors = function() {
    this.cfg = getEffectConfig();
    var cols = this.cfg.colors;
    for (var i = 0; i < this.particles.length; i++) {
      this.particles[i].color = cols[Math.floor(Math.random() * cols.length)];
    }
  };

  E.prototype.resetAll = function() {
    this.make();
  };

  E.prototype.loop = function() {
    var self = this;
    (function frame() {
      self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
      var c = self.cfg;
      for (var i = 0; i < self.particles.length; i++) {
        var p = self.particles[i];
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y * 0.01 + p.ph) * 0.25;
        p.r += p.vr;
        p.twinkle += 0.03;
        var resetY = c.fallSpeed < 0 ? -20 : self.canvas.height + 30;
        var resetY2 = c.fallSpeed < 0 ? self.canvas.height + 30 : -20;
        if (c.fallSpeed < 0) {
          if (p.y < -20) self.particles[i] = self.rnd(false);
        } else {
          if (p.y > self.canvas.height + 30) self.particles[i] = self.rnd(false);
        }
        if (p.x > self.canvas.width + 30) p.x = -30;
        if (p.x < -30) p.x = self.canvas.width + 30;
        self.draw(p);
      }
      requestAnimationFrame(frame);
    })();
  };
  return E;
})();

document.addEventListener('DOMContentLoaded', function() {
  new EffectEngine('petalCanvas');
  var tb = document.getElementById('themeBtn');
  if (tb) {
    tb.addEventListener('click', function() {
      setTimeout(function() {
        if (_effectInstance) _effectInstance.resetAll();
      }, 200);
    });
  }
  var db = document.getElementById('darkBtn');
  if (db) {
    db.addEventListener('click', function() {
      setTimeout(function() {
        if (_effectInstance) _effectInstance.resetAll();
      }, 200);
    });
  }
});
