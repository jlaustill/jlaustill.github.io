import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '../constants';

interface IPageMetaProps {
  path: string;
  title: string;
  description: string;
}

const PageMeta = ({ path, title, description }: IPageMetaProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={`${SITE_URL}${path}`} />
  </Helmet>
);

export default PageMeta;
