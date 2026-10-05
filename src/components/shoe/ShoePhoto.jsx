import {imageUrl} from '../../lib/supabase';

// Each catalog sheet contains twenty original photos. Position the complete
// sheet behind a square viewport; never stretch or duplicate a selected pair.
export default function ShoePhoto({image, alt, className = '', ...props}) {
  const cell = image?.demo_cell;
  if (!cell) return <img src={imageUrl(image?.path)} alt={alt ?? image?.alt ?? 'Shoe photo'} className={className || undefined} {...props}/>;
  return <span className={`sf-demo-photo ${className}`.trim()} data-photo-key={`${image.path}:${cell.column}:${cell.row}`}>
    <img src={imageUrl(image.path)} alt={alt ?? image.alt ?? 'Demo shoe design'} {...props}
      style={{position:'absolute',width:`${cell.columns * 100}%`,height:`${cell.rows * 100}%`,left:`${-cell.column * 100}%`,top:`${-cell.row * 100}%`,maxWidth:'none',objectFit:'fill'}}/>
  </span>;
}
