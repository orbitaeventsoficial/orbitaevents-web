import NextErrorComponent from 'next/error';
import type { NextPageContext } from 'next';

interface ErrorProps {
  statusCode: number;
}

function CustomError({ statusCode }: ErrorProps) {
  return <NextErrorComponent statusCode={statusCode} />;
}

CustomError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode ?? 500 : 404;
  return { statusCode };
};

export default CustomError;
