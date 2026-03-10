import { useEffect, useState } from 'react'
import { Card, Input, Button, message, Spin, Result, Steps, Alert } from 'antd'
import { GiftOutlined, MailOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { publicApi } from '../api'

interface SeatStats {
  available_seats: number
}

interface SiteConfig {
  site_title: string
  site_description: string
  home_notice: string
  success_message: string
  footer_text: string
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [seats, setSeats] = useState<SeatStats | null>(null)
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [step, setStep] = useState(0)
  
  // 表单
  const [email, setEmail] = useState('')
  const [redeemCode, setRedeemCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; team?: string } | null>(null)

  useEffect(() => {
    // 获取站点配置
    publicApi.getSiteConfig().then((res: any) => {
      setSiteConfig(res)
      // 更新页面标题
      if (res.site_title) {
        document.title = res.site_title
      }
    }).catch(() => {})
    
    // 获取座位统计
    publicApi.getSeats().then((res: any) => setSeats(res)).catch(() => {})
    setLoading(false)
  }, [])

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      message.error('请输入有效的邮箱地址')
      return
    }
    if (!redeemCode.trim()) {
      message.error('请输入兑换码')
      return
    }

    setSubmitting(true)
    try {
      const res: any = await publicApi.redeem({
        email: email.trim(),
        redeem_code: redeemCode.trim().toUpperCase(),
      })
      setResult({ success: true, message: res.message, team: res.team_name })
      setStep(1)
    } catch (e: any) {
      message.error(e.response?.data?.detail || '兑换失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setEmail('')
    setRedeemCode('')
    setResult(null)
    setStep(0)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)',
      padding: 20,
    }}>
      {/* 装饰光晕 */}
      <div style={{ position: 'fixed', top: '10%', right: '20%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(147, 197, 253, 0.3) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '20%', left: '15%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(196, 181, 253, 0.25) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />

      <Card style={{
        width: 440,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderRadius: 24,
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img 
            src="/logo.jpg" 
            alt="Logo" 
            style={{ 
              width: 56, 
              height: 56, 
              borderRadius: 16,
              objectFit: 'cover',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              display: 'block',
            }} 
          />
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: '#1a1a2e' }}>
            {siteConfig?.site_title || 'ChatGPT Team 自助上车'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
            {siteConfig?.site_description || '使用兑换码加入 Team'}
          </p>
        </div>

        {/* 首页公告 */}
        {siteConfig?.home_notice && (
          <Alert
            message={siteConfig.home_notice}
            type="info"
            showIcon
            style={{ marginBottom: 20, borderRadius: 12 }}
          />
        )}

        {/* 座位统计 */}
        {seats && (
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px 0', 
            marginBottom: 24,
            background: 'rgba(0,0,0,0.02)', 
            borderRadius: 12,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{seats.available_seats}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>可用空位</div>
            </div>
          </div>
        )}

        {/* 步骤条 */}
        <Steps current={step} size="small" style={{ marginBottom: 28 }} items={[
          { title: '兑换' },
          { title: '完成' },
        ]} />

        {/* Step 0: 输入兑换码 */}
        {step === 0 && (
          <div>
            {/* 邮箱 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>邮箱地址</div>
              <Input
                prefix={<MailOutlined style={{ color: '#94a3b8', marginRight: 8 }} />}
                placeholder="  your@email.com"
                size="large"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                邀请邮件将发送到此邮箱
              </div>
            </div>

            {/* 兑换码 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>兑换码</div>
              <Input
                prefix={<GiftOutlined style={{ color: '#94a3b8', marginRight: 8 }} />}
                placeholder="  输入兑换码"
                size="large"
                value={redeemCode}
                onChange={e => setRedeemCode(e.target.value.toUpperCase())}
              />
            </div>

            <Button 
              type="primary" 
              block 
              size="large" 
              loading={submitting}
              onClick={handleSubmit}
              disabled={!email || !redeemCode}
              style={{ height: 48, borderRadius: 12, fontWeight: 600 }}
            >
              立即兑换
            </Button>
          </div>
        )}

        {/* Step 1: 完成 */}
        {step === 1 && (
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#10b981' }} />}
            title="兑换成功！"
            subTitle={
              <div>
                <p>{result?.message || '邀请已发送，请查收邮箱并接受邀请'}</p>
                <p style={{ color: '#64748b', fontSize: 13 }}>
                  邀请邮箱：{email}
                </p>
                {result?.team && (
                  <p style={{ color: '#64748b', fontSize: 13 }}>
                    分配 Team：{result.team}
                  </p>
                )}
                <p style={{ color: '#f59e0b', fontSize: 13, marginTop: 12 }}>
                  {siteConfig?.success_message || '请查收邮箱并接受邀请'}
                </p>
              </div>
            }
            extra={
              <Button onClick={handleReset}>继续兑换</Button>
            }
          />
        )}

        {/* 页脚 */}
        {siteConfig?.footer_text && (
          <div style={{ textAlign: 'center', marginTop: 20, color: '#94a3b8', fontSize: 12 }}>
            {siteConfig.footer_text}
          </div>
        )}

      </Card>
    </div>
  )
}
