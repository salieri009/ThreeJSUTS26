// Simple icon generator using canvas (for development)
// In production, use proper icon generation tools

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function generateIcon(size) {
  canvas.width = size;
  canvas.height = size;
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#6366f1');
  gradient.addColorStop(1, '#14b8a6');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Add farm icon (simplified)
  ctx.fillStyle = '#ffffff';
  ctx.font = `${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌾', size / 2, size / 2);
  
  return canvas.toDataURL('image/png');
}

// Generate all required sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const dataUrl = generateIcon(size);
  const link = document.createElement('a');
  link.download = `icon-${size}x${size}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

console.log('Icons generated successfully!');
