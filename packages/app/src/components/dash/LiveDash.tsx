import { DASHBOARD_URL } from '../../config'

export interface LiveDashProps {
  width?: number
  height?: number
}

export function LiveDash({ width = 960, height = 720 }: LiveDashProps) {
  const dashboardUrl = DASHBOARD_URL

  return (
    <>
      {dashboardUrl && (
        <>
          <iframe width={width} height={height} src={dashboardUrl}></iframe>
          <a href={DASHBOARD_URL} target="_blank">
            Link to dash in another tab
          </a>
        </>
      )}
      {!dashboardUrl && (
        <div className="card">
          <p>
            The live dashboard requires some extra setup. For details see:
            <code>
              <a href="https://github.com/ae9is/anything/blob/main/packages/infra/dash/README.md">
                /packages/infra/dash/README.md
              </a>
            </code>
          </p>
        </div>
      )}
    </>
  )
}
