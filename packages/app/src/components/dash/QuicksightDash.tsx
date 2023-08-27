import { DASHBOARD_URL } from "../../config"

export interface QuickSightDashProps {
  width?: number
  height?: number
}

export function QuickSightDash({
  width = 960,
  height = 720,
}: QuickSightDashProps) {
  const dashboardUrl = DASHBOARD_URL

  // Embedding a quicksight dashboard
  // ref: https://docs.aws.amazon.com/quicksight/latest/user/embedded-analytics-1-click.html
  return (
    <>
      {dashboardUrl && (
        <iframe
          width={width}
          height={height}
          src={dashboardUrl}>
        </iframe>
      )}
    </>
  )
}