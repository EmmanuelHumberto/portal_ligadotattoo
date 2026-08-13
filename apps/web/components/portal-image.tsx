import Image, {ImageProps} from 'next/image';

export function PortalImage(props:ImageProps){
 return <Image {...props}
  sizes={props.sizes??'(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw'}
 />;
}
