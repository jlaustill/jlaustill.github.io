import { Link } from '@mui/material';

interface IRefProps {
  id: number;
  children?: React.ReactNode;
}

const Ref = ({ id, children }: IRefProps) => (
  <sup>
    <Link href={`#ref-${id}`} underline="hover" sx={{ fontSize: '0.75rem' }}>
      [{id}]
    </Link>
    {children}
  </sup>
);

export default Ref;
