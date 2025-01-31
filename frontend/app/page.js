import Image from 'next/image'
import logo from '../public/logo-03.svg';

export default function Home() {
  return (
    <Image
      src={logo}
      width={500}
      height={500}
      alt="Picture of the author"
    />
  )
}
