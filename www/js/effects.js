// ===== 花瓣飘落特效 v3（轻量优化） =====
var _petalInstance = null;

function getPetalColors() {
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return isDark
    ? ['rgba(255,179,186,0.3)', 'rgba(232,160,176,0.25)', 'rgba(221,160,176,0.2)']
    : ['rgba(255,183,178,0.3)', 'rgba(255,218,193,0.25)', 'rgba(255,154,162,0.25)'];
}

var PetalEffect = (function() {
  function P(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.petals = [];
    this.resize();
    this.make(20);
    var self = this;
    window.addEventListener('resize', function() { self.resize(); });
    this.loop();
    _petalInstance = this;
  }
  P.prototype.resize = function() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };
  P.prototype.make = function(n) {
    for (var i = 0; i < n; i++) this.petals.push(this.rnd(true));
  };
  P.prototype.rnd = function(sr) {
    var colors = getPetalColors();
    return {
      x: Math.random() * this.canvas.width,
      y: sr ? Math.random() * this.canvas.height : -20,
      s: Math.random() * 8 + 4,
      vy: Math.random() * 0.6 + 0.2,
      vx: Math.random() * 0.3 - 0.15,
      r: Math.random() * 360,
      vr: Math.random() * 1.5 - 0.75,
      o: Math.random() * 0.2 + 0.06,
      c: colors[Math.floor(Math.random() * colors.length)],
      ph: Math.random() * Math.PI * 2,
    };
  };
  P.prototype.draw = function(p) {
    var ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = p.o;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r * Math.PI / 180);
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.s, p.s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  P.prototype.updateColors = function() {
    var colors = getPetalColors();
    for (var i = 0; i < this.petals.length; i++) {
      this.petals[i].c = colors[Math.floor(Math.random() * colors.length)];
    }
  };
  P.prototype.loop = function() {
    var self = this;
    (function frame() {
      self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
      for (var i = 0; i < self.petals.length; i++) {
        var p = self.petals[i];
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y * 0.012 + p.ph) * 0.25;
        p.r += p.vr;
        if (p.y > self.canvas.height + 20) self.petals[i] = self.rnd(false);
        if (p.x > self.canvas.width + 20) p.x = -20;
        if (p.x < -20) p.x = self.canvas.width + 20;
        self.draw(p);
      }
      requestAnimationFrame(frame);
    })();
  };
  return P;
})();

document.addEventListener('DOMContentLoaded', function() {
  new PetalEffect('petalCanvas');
  var btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', function() {
      setTimeout(function() {
        if (_petalInstance && _petalInstance.updateColors) _petalInstance.updateColors();
      }, 100);
    });
  }
});
