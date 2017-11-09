
(function(){
  fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
  fabric.Cbutton =	fabric.util.createClass(fabric.Rect, {
  type: 'cbutton',

  initialize: function(options) {
    options || (options = { });
    console.log(2);
    this.callSuper('initialize', options);
    this.set('label', options.label || '');

    this.on('mouseover', function() {
      this.set('fill',  'red');
      canvas.renderAll();
    });
    this.on('mouseout', function() {
      this.set('fill',  'green');
      canvas.renderAll();
    });
  },

  toObject: function() {
    return fabric.util.object.extend(this.callSuper('toObject'), {
      label: this.get('label')
    });
  },

  _render: function(ctx) {
    this.callSuper('_render', ctx);
    ctx.font = '20px 微软雅黑';
    ctx.fillStyle = '#333';
    // console.log(this);
    ctx.fillText(this.label, -this.width/2, 0);
  }
});
fabric.Cbutton.fromObject = function(object) {
  console.log(object);
  return new fabric.Cbutton(object);
};
})()
