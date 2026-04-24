"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowUpRight,
  CalendarDays,
  Eye,
  Heart,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  Send,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const metrics = [
  {
    title: "Total Reach",
    value: "8.7M",
    description: "Across paid and organic channels",
    change: "+18.4%",
    trend: "up",
    icon: Eye,
    footer: "Audience expansion is accelerating",
    subfooter: "Best lift from short-form video",
  },
  {
    title: "Engagement Rate",
    value: "6.82%",
    description: "Weighted by impressions",
    change: "+2.1%",
    trend: "up",
    icon: Heart,
    footer: "Above quarterly benchmark",
    subfooter: "Comments and shares are leading",
  },
  {
    title: "New Followers",
    value: "124.8K",
    description: "Net growth this month",
    change: "+11.6%",
    trend: "up",
    icon: Users,
    footer: "Community growth remains healthy",
    subfooter: "Creator collaborations outperforming",
  },
  {
    title: "Cost Per Lead",
    value: "$18.42",
    description: "Blended acquisition cost",
    change: "-7.3%",
    trend: "down",
    icon: MousePointerClick,
    footer: "Efficiency improved this week",
    subfooter: "Retargeting audiences lowered CPL",
  },
]

const audienceData = [
  { date: "Apr 01", followers: 842, impressions: 2100, engagement: 118 },
  { date: "Apr 04", followers: 891, impressions: 2380, engagement: 146 },
  { date: "Apr 07", followers: 944, impressions: 2610, engagement: 173 },
  { date: "Apr 10", followers: 1012, impressions: 3120, engagement: 209 },
  { date: "Apr 13", followers: 1075, impressions: 3350, engagement: 241 },
  { date: "Apr 16", followers: 1168, impressions: 3980, engagement: 298 },
  { date: "Apr 19", followers: 1215, impressions: 4260, engagement: 322 },
  { date: "Apr 22", followers: 1318, impressions: 4890, engagement: 386 },
]

const audienceChartConfig = {
  followers: {
    label: "Followers",
    color: "var(--chart-1)",
  },
  impressions: {
    label: "Impressions",
    color: "var(--chart-2)",
  },
  engagement: {
    label: "Engagement",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const channelData = [
  { channel: "Instagram", reach: 3200, engagement: 2480 },
  { channel: "TikTok", reach: 4100, engagement: 3180 },
  { channel: "LinkedIn", reach: 1900, engagement: 980 },
  { channel: "YouTube", reach: 2600, engagement: 1420 },
  { channel: "X", reach: 1500, engagement: 760 },
]

const channelChartConfig = {
  reach: {
    label: "Reach",
    color: "var(--chart-1)",
  },
  engagement: {
    label: "Engagement",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

const socialMixData = [
  { name: "Paid Social", value: 38, color: "var(--chart-1)" },
  { name: "Organic", value: 27, color: "var(--chart-2)" },
  { name: "Creators", value: 22, color: "var(--chart-3)" },
  { name: "Community", value: 13, color: "var(--chart-4)" },
]

const socialMixConfig = {
  paid: {
    label: "Paid Social",
    color: "var(--chart-1)",
  },
  organic: {
    label: "Organic",
    color: "var(--chart-2)",
  },
  creators: {
    label: "Creators",
    color: "var(--chart-3)",
  },
  community: {
    label: "Community",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

const campaigns = [
  {
    name: "Spring Product Launch",
    channel: "TikTok + Instagram",
    owner: "Lena",
    budget: "$42,000",
    roi: "4.8x",
    status: "Live",
  },
  {
    name: "Founder Thought Leadership",
    channel: "LinkedIn",
    owner: "Marcus",
    budget: "$8,500",
    roi: "3.1x",
    status: "Optimizing",
  },
  {
    name: "Creator Spark Program",
    channel: "Creators",
    owner: "Nora",
    budget: "$28,400",
    roi: "5.6x",
    status: "Live",
  },
  {
    name: "Retargeting Warm Leads",
    channel: "Paid Social",
    owner: "Quinn",
    budget: "$18,200",
    roi: "6.2x",
    status: "Review",
  },
]

const contentPipeline = [
  { stage: "Ideas", value: 28, total: 40, icon: Sparkles },
  { stage: "Scripting", value: 17, total: 24, icon: MessageCircle },
  { stage: "Production", value: 12, total: 18, icon: Megaphone },
  { stage: "Scheduled", value: 31, total: 36, icon: CalendarDays },
]

const topPosts = [
  {
    title: "Behind the launch week workflow",
    network: "TikTok",
    metric: "1.8M views",
    delta: "+24%",
  },
  {
    title: "Customer story carousel",
    network: "Instagram",
    metric: "84K saves",
    delta: "+17%",
  },
  {
    title: "Market insight thread",
    network: "LinkedIn",
    metric: "19K clicks",
    delta: "+9%",
  },
]

const activityFeed = [
  {
    user: "LN",
    title: "Lena approved three creator drafts",
    description: "Ready for publishing on Friday",
    time: "12 min ago",
  },
  {
    user: "MQ",
    title: "Marcus paused a low-CTR ad set",
    description: "Budget shifted to retargeting",
    time: "34 min ago",
  },
  {
    user: "NS",
    title: "Nora added 14 UGC clips",
    description: "Queued for product launch edits",
    time: "1 hr ago",
  },
]

export default function Dashboard3() {
  return (
    <div className="flex-1 space-y-6 px-6 pt-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Marketing Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track social growth, campaign efficiency, and content performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs defaultValue="30d">
            <TabsList>
              <TabsTrigger value="7d" className="cursor-pointer">
                7D
              </TabsTrigger>
              <TabsTrigger value="30d" className="cursor-pointer">
                30D
              </TabsTrigger>
              <TabsTrigger value="90d" className="cursor-pointer">
                90D
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" className="cursor-pointer">
            <Send className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="@container/main space-y-6">
        <MetricCards />

        <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-3">
          <AudienceGrowthChart />
          <SocialMixCard />
        </div>

        <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-2">
          <ChannelPerformanceChart />
          <ContentPipelineCard />
        </div>

        <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-3">
          <CampaignTable />
          <SocialActivityFeed />
        </div>
      </div>
    </div>
  )
}

function MetricCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 @5xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown

        return (
          <Card key={metric.title}>
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendIcon className="h-4 w-4" />
                  {metric.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex items-center gap-2 font-medium">
                {metric.footer}
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="text-muted-foreground">{metric.subfooter}</div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

function AudienceGrowthChart() {
  return (
    <Card className="@5xl:col-span-2">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Audience Growth</CardTitle>
          <CardDescription>
            Followers, impressions, and engagement over the month
          </CardDescription>
        </div>
        <Badge variant="secondary" className="w-fit">
          <ArrowUpRight className="h-4 w-4" />
          Strong momentum
        </Badge>
      </CardHeader>
      <CardContent>
        <ChartContainer config={audienceChartConfig} className="h-[340px] w-full">
          <AreaChart
            data={audienceData}
            margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="followersFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-followers)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-followers)"
                  stopOpacity={0.04}
                />
              </linearGradient>
              <linearGradient id="impressionsFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-impressions)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-impressions)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} className="stroke-muted/30" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis axisLine={false} tickLine={false} tickMargin={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="impressions"
              type="monotone"
              stroke="var(--color-impressions)"
              fill="url(#impressionsFill)"
              strokeWidth={2}
            />
            <Area
              dataKey="followers"
              type="monotone"
              stroke="var(--color-followers)"
              fill="url(#followersFill)"
              strokeWidth={2}
            />
            <Area
              dataKey="engagement"
              type="monotone"
              stroke="var(--color-engagement)"
              fill="transparent"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function SocialMixCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Mix</CardTitle>
        <CardDescription>Share of attributed campaign impact</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChartContainer config={socialMixConfig} className="mx-auto h-[230px]">
          <PieChart>
            <Pie
              data={socialMixData}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={3}
            >
              {socialMixData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="name" hideLabel />}
            />
          </PieChart>
        </ChartContainer>
        <div className="grid gap-3">
          {socialMixData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ChannelPerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Performance</CardTitle>
        <CardDescription>Reach and engagement by social network</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ChartContainer config={channelChartConfig} className="h-[320px] w-full">
          <BarChart data={channelData} margin={{ top: 12, right: 12, left: 0 }}>
            <CartesianGrid vertical={false} className="stroke-muted/30" />
            <XAxis
              dataKey="channel"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis axisLine={false} tickLine={false} tickMargin={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="reach"
              fill="var(--color-reach)"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="engagement"
              fill="var(--color-engagement)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--chart-1)]" />
            Reach
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-[var(--chart-4)]" />
            Engagement
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ContentPipelineCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Pipeline</CardTitle>
        <CardDescription>Production capacity for the next two weeks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {contentPipeline.map((item) => {
          const Icon = item.icon
          const progress = Math.round((item.value / item.total) * 100)

          return (
            <div key={item.stage} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.stage}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.value} of {item.total} assets
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{progress}%</Badge>
              </div>
              <Progress value={progress} />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function CampaignTable() {
  return (
    <Card className="@5xl:col-span-2">
      <CardHeader>
        <CardTitle>Active Campaigns</CardTitle>
        <CardDescription>Budget, ownership, and current return</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.name}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>{campaign.channel}</TableCell>
                <TableCell>{campaign.owner}</TableCell>
                <TableCell>{campaign.budget}</TableCell>
                <TableCell>{campaign.roi}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      campaign.status === "Live"
                        ? "default"
                        : campaign.status === "Review"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {campaign.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SocialActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Desk</CardTitle>
        <CardDescription>Team updates and top-performing posts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          {activityFeed.map((item) => (
            <div key={item.title} className="flex gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{item.user}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-none">{item.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Top Posts</h3>
            <Button variant="ghost" size="sm" className="h-8 cursor-pointer">
              View all
            </Button>
          </div>
          {topPosts.map((post) => (
            <div
              key={post.title}
              className="rounded-lg border bg-card p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{post.title}</p>
                  <p className="text-muted-foreground">{post.network}</p>
                </div>
                <Badge variant="outline">
                  <Share2 className="h-3.5 w-3.5" />
                  {post.delta}
                </Badge>
              </div>
              <p className="mt-2 text-muted-foreground">{post.metric}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
