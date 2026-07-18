const Charts = {
  drawPie(canvas, values, labels, colors) {
    if (!canvas?.getContext) return;
    const ctx = canvas.getContext('2d');
    const total = values.reduce((sum, value) => sum + value, 0) || 1;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let startAngle = -Math.PI / 2;
    values.forEach((value, index) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index] || `hsl(${index * 65}, 70%, 58%)`;
      ctx.fill();
      startAngle += sliceAngle;
    });
    ctx.fillStyle = '#fff';
    ctx.font = '16px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Performance', centerX, centerY + 6);
  },
  drawBar(canvas, values, labels, color) {
    if (!canvas?.getContext) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    const margin = 32;
    const maxValue = Math.max(...values, 10);
    const barWidth = Math.max(20, (width - margin * 2) / values.length - 10);
    values.forEach((value, index) => {
      const x = margin + index * (barWidth + 10);
      const barHeight = (height - margin * 2) * (value / maxValue);
      ctx.fillStyle = color || '#56b5e7';
      ctx.fillRect(x, height - margin - barHeight, barWidth, barHeight);
      ctx.fillStyle = '#fff';
      ctx.font = '12px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${value}%`, x + barWidth / 2, height - margin - barHeight - 8);
      ctx.fillText(labels[index], x + barWidth / 2, height - 8);
    });
  },
  drawLine(canvas, data, labels, color) {
    if (!canvas?.getContext) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    const margin = 32;
    const maxValue = Math.max(...data, 10);
    const step = (width - margin * 2) / Math.max(data.length - 1, 1);
    ctx.strokeStyle = color || '#6dd1a4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((value, index) => {
      const x = margin + step * index;
      const y = height - margin - ((height - margin * 2) * (value / maxValue));
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    data.forEach((value, index) => {
      const x = margin + step * index;
      const y = height - margin - ((height - margin * 2) * (value / maxValue));
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#2c86be';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.font = '12px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${value}%`, x, y - 12);
      ctx.fillText(labels[index], x, height - 8);
    });
  }
};
