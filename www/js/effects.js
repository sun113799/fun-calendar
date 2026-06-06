// ===== 花瓣飘落特效 v2 =====
// 主题适配：暗色模式下花瓣颜色跟随变化

var petalEffectInstance = null;

function getPetalColors() {
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return isDark
    ? ['#FFB3BA', '#E8A0B0', '#DDA0B0', '#FFC8D6', '#E0C0D0', '#D090A0']
    : ['#FFB7B2', '#FFDAC1', '#FF9AA2', '#FFD1DC', '#FFE0E0', '#FFC8D6'];
}

var PetalEffect = (function() {
  function PetalEffect(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.petals = [];
    this.resize();
    this.createPetals(30);
    var self = this;
    window.addEventListener('resize', function() { self.resize(); });
    this.animate();
    petalEffectInstance = this;
  }

  PetalEffect.prototype.resize = function() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };

  PetalEffect.prototype.createPetals = function(count) {
    this.petals = [];
    for (var i = 0; i < count; i++) {
      this.petals.push(this.randomPetal(true));
    }
  };

  PetalEffect.prototype.randomPetal = function(startRandom) {
    var colors = getPetalColors();
    return {
      x: Math.random() * this.canvas.width,
      y: startRandom ? Math.random() * this.canvas.height : -30,
      size: Math.random() * 10 + 5,
      speedY: Math.random() * 0.8 + 0.3,
      speedX: Math.random() * 0.4 - 0.2,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 2 - 1,
      opacity: Math.random() * 0.25 + 0.08,
      swingAmp: Math.random() * 40 + 20,
      swingSpeed: Math.random() * 0.015 + 0.005,
      color: colors[Math.floor(Math.random() * colors.length)],
      phase: Math.random() * Math.PI * 2,
    };
  };

  PetalEffect.prototype.drawPetal = function(p) {
    var ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  PetalEffect.prototype.updateColors = function() {
    var colors = getPetalColors();
    for (var i = 0; i < this.petals.length; i++) {
      this.petals[i].color = colors[Math.floor(Math.random() * colors.length)];
    }
  };

  PetalEffect.prototype.animate = function() {
    var self = this;
    function frame() {
      self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
      for (var i = 0; i < self.petals.length; i++) {
        var p = self.petals[i];
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y * p.swingSpeed + p.phase) * 0.3;
        p.rotation += p.rotationSpeed;
        if (p.y > self.canvas.height + 30) self.petals[i] = self.randomPetal(false);
        if (p.x > self.canvas.width + 30) p.x = -30;
        if (p.x < -30) p.x = self.canvas.width + 30;
        self.drawPetal(p);
      }
      requestAnimationFrame(frame);
    }
    frame();
  };

  return PetalEffect;
})();

// 主题切换时更新花瓣颜色
var origThemeToggle = null;
document.addEventListener('DOMContentLoaded', function() {
  new PetalEffect('petalCanvas');

  // 监听主题切换按钮，切换后更新花瓣颜色
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      setTimeout(function() {
        if (petalEffectInstance && petalEffectInstance.updateColors) {
          petalEffectInstance.updateColors();
        }
      }, 100);
    });
  }
});
