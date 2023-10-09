import { Form, FormInput, FormSubmit, useFormStore } from "@ariakit/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router"
import { useEffect } from "react";
import { useMediaQuery } from 'react-responsive'

const baseUrl = process.env.NEXT_PUBLIC_API_BASE;

interface ButtonProps extends React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>> { }
const Button = ({ children, ...props }: ButtonProps) => {
  return (
    <button
      className="bg-gray-700 p-4 text-white disabled:opacity-75 disabled:cursor-not-allowed"
      {...props}
    >
      {children}
    </button>
  )
}

const fetchOrders = async (
  page = 1,
  limit = 2,
  filter: string | undefined
) => {
  let url = `${baseUrl}/api/orders?page=${page}&limit=${limit}`;
  if (filter) {
    url += `&filter=${filter}`
  }
  return fetch(url).then(res => res.json())
}

export default function Home() {
  const { query, isReady, push } = useRouter();
  const isMobile = useMediaQuery({
    maxWidth: '750px'
  })

  const page = query.page || '1'
  // use different default limits for mobile/desktop
  const limit = query.limit || (isMobile ? '1' : '2')
  const { data: { data, meta } } = useQuery({
    queryKey: ['orders', { page, limit, filter: query.filter }],
    queryFn: () => fetchOrders(
      page as unknown as number,
      limit as unknown as number,
      query.filter as unknown as string
    ),
    enabled: isReady,
    initialData: { data: [], meta: {} }
  })


  const form = useFormStore({ defaultValues: { filter: '' } });
  form.useSubmit(state => {
    const filterValue = state.values.filter?.trim()
    let { filter, ...queryParams } = query
    queryParams.page = '1'
    if (filterValue) {
      push({ query: { ...queryParams, filter: filterValue } }, undefined, { shallow: true })
    } else {
      const { filter, ...queryParams } = query
      push({ query: { ...queryParams } }, undefined, { shallow: true })
    }
  })

  // set initial filter input value
  useEffect(() => {
    if (isReady && !form.item('filter') && typeof query.filter !== 'undefined') {
      form.setValue('filter', query.filter)
    }
  }, [isReady, query, form])

  const onChangePage = (page: number) => () =>
    push({ query: { ...query, page } });

  const onChangeLimit = (limit: number) => () =>
    push({ query: { ...query, limit, page: 1 } }, undefined, { shallow: true });


  return (
    <div>
      <Form store={form}>
        <input type="text" name="filter" />
        <FormInput
          name={form.names.filter}
          placeholder="search..."
        />
        <FormSubmit className="hidden">Submit</FormSubmit>
      </Form>
      <div className="flex gap-4">
        <Button onClick={onChangePage(1)} disabled={meta?.current_page === 1}>first</Button>
        <Button onClick={onChangePage(meta?.current_page - 1)} disabled={meta?.current_page === 1}>prev</Button>
        <Button onClick={onChangePage(meta?.current_page + 1)} disabled={meta?.current_page === meta?.last_page}>next</Button>
        <Button onClick={onChangePage(meta?.last_page)} disabled={meta?.current_page === meta?.last_page}>last</Button>
      </div>
      <div className="flex gap-4">
        <Button onClick={onChangeLimit(2)}>2</Button>
        <Button onClick={onChangeLimit(4)}>4</Button>
        <Button onClick={onChangeLimit(8)}>8</Button>
        <Button onClick={onChangeLimit(10)}>10</Button>
      </div>
      <h1 className="text-xl">Data</h1>
      <code><pre>{JSON.stringify(data, null, 2)}</pre></code>
      <h1 className="text-xl">Meta</h1>
      <code><pre>{JSON.stringify(meta, null, 2)}</pre></code>
    </div>
  )
}

// export const getServerSideProps = (async context => {
//   console.log('req:', context.req);
//   const userAgent = context.req.headers['user-agent']
//   let isMobile = false
//   if (userAgent) {
//     const { isMobile: isUserAgentMobile } = getSelectorsByUserAgent(userAgent)
//     console.log('mobile:', isUserAgentMobile)
//     isMobile = isUserAgentMobile
//   }
//   return {
//     props: { isMobile }
//   }
// }) satisfies GetServerSideProps<{
// }>
