import BookStudy from '../../../components/BookStudy';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;

  return (
    <BookStudy
      key={id + ':' + (mode || 'practice')}
      id={id}
      exam={mode === 'exam'}
    />
  );
}
