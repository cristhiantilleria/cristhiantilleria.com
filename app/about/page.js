import PageWrapper from '@/components/pagewrapper';
import fs from 'fs';
import Image from 'next/image';
import Link from 'next/link';
import path from 'path';
import { getPlaiceholder } from 'plaiceholder';
import { BsArrowRight } from 'react-icons/bs';
import styles from './about.module.css';

async function getBlurData() {
  const { base64 } = await getPlaiceholder(
    fs.readFileSync(path.join(process.cwd(), 'public/assets/cristhiantilleria.jpg'))
  );
  return base64;
}

export default async function About() {
  const blurData = await getBlurData();

  return (
    <PageWrapper className={styles.about}>
      <section className={styles.about__column} grid-col="1">
        <div className={styles.about__headshot}>
          <Image
            src="/assets/cristhiantilleria.jpg"
            alt="Cristhian Tilleria"
            height={320}
            width={320}
            priority
            placeholder="blur"
            blurDataURL={blurData}
          />
        </div>
        <div className={styles.about__socials}>
          <Link target="blank" href="mailto:cristhiantilleria@gmail.com">
            <BsArrowRight />
            &nbsp; Email
          </Link>
          <Link target="blank" href="https://github.com/cristhianbenitez">
            <BsArrowRight />
            &nbsp; Github
          </Link>
          <Link target="blank" href="https://www.instagram.com/cristhiantilleria25">
            <BsArrowRight />
            &nbsp; Instagram
          </Link>
        </div>
      </section>
      <section className={styles.about__column} grid-col="2">
        <p className={styles.about__headline}>
          New York based designer, developer and{' '}
          <a href="https://www.pipebenitez.com" style={{ color: 'inherit', textDecoration: 'underline' }}>
            photographer
          </a>
          .
        </p>
        <p className={styles.about__headline}>For inquiries send me a message through email or social media.</p>
        {/* <div className={styles.about__services}>
          <ul>
            <li style={{ fontWeight: '500', marginBottom: '.5rem' }}>Services</li>
            <li>Web Development</li>
            <li>Web Design </li>
            <li>Full-Stack Development</li>
            <li>Brand Identity</li>
            <li>Logo Design</li>
          </ul>
        </div> */}
      </section>
    </PageWrapper>
  );
}
