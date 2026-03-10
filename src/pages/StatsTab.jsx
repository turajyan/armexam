import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../dateUtils.js';

const LEVEL_COLORS = {
  A1: "#4ade80", A2: "#86efac", B1: "#60a5fa",
  B2: "#93c5fd", C1: "#f59e0b", C2: "#fbbf24",
};

const StatsTab = ({ theme, user }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fmtDate = d => d ? formatDate(d) : '';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.studentStats();
        setStats(response);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return <div style={{ padding: 24, color: theme.muted }}>{t('dash.loading') || 'Loading...'}</div>;
  }

  // Calculate level with most exams
  const levelEntries = Object.entries(stats.progressByLevel || {});
  const maxLevel = levelEntries.length > 0 
    ? levelEntries.reduce((a, b) => (b[1] || 0) > (a[1] || 0) ? b : a)[0]
    : null;
  const currentLevelColor = LEVEL_COLORS[maxLevel] || theme.gold;

  const hasCertificates = stats.certificates && stats.certificates.length > 0;

  return (
    <div style={{ 
      padding: '32px 40px', 
      paddingBottom: 80,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24, maxWidth: 1200, margin: '0 auto 24px' }}>
        <h3 style={{ 
          color: theme.text, 
          fontWeight: 600, 
          fontSize: 22,
          fontFamily: "'Cormorant Garamond', serif"
        }}>
          {t('dash.stats.title')}
        </h3>
        {user?.name && (
          <p style={{ color: theme.muted, marginTop: 4, fontSize: 14 }}>
            {user.name}
          </p>
        )}
      </div>

      {/* Main Content - 2 columns */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: hasCertificates ? '1fr 420px' : '1fr',
        gap: 24, 
        maxWidth: 1400, 
        margin: '0 auto',
        alignItems: 'start'
      }}>
        {/* Left Column - Stats */}
        <div>
          {/* Top Stats Cards - 2 columns */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 16, 
            marginBottom: 24 
          }}>
            {/* Total Exams */}
            <div style={{ 
              background: theme.card, 
              border: `1px solid ${theme.border}`, 
              borderRadius: 16, 
              padding: 20,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                top: -10,
                right: -10,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `${theme.gold}15`
              }} />
              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 8, fontWeight: 500 }}>
                {t('dash.stats.total_exams')}
              </div>
              <div style={{ 
                fontSize: 36, 
                color: theme.text, 
                fontWeight: 700,
                fontFamily: "'Cormorant Garamond', serif",
                lineHeight: 1
              }}>
                {stats.totalExams || 0}
              </div>
            </div>

            {/* Passed Exams */}
            <div style={{ 
              background: theme.card, 
              border: `1px solid ${theme.border}`, 
              borderRadius: 16, 
              padding: 20,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                top: -10,
                right: -10,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `${theme.success}15`
              }} />
              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 8, fontWeight: 500 }}>
                {t('dash.stats.passed_exams')}
              </div>
              <div style={{ 
                fontSize: 36, 
                color: theme.success, 
                fontWeight: 700,
                fontFamily: "'Cormorant Garamond', serif",
                lineHeight: 1
              }}>
                {stats.passedExams || 0}
              </div>
            </div>

            {/* Average Score */}
            <div style={{ 
              background: theme.card, 
              border: `1px solid ${theme.border}`, 
              borderRadius: 16, 
              padding: 20,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                top: -10,
                right: -10,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `${currentLevelColor}15`
              }} />
              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 8, fontWeight: 500 }}>
                {t('dash.stats.avg_score')}
              </div>
              <div style={{ 
                fontSize: 36, 
                color: currentLevelColor, 
                fontWeight: 700,
                fontFamily: "'Cormorant Garamond', serif",
                lineHeight: 1
              }}>
                {Math.round(stats.avgScore || 0)}%
              </div>
            </div>

            {/* Current Level */}
            <div style={{ 
              background: theme.card, 
              border: `1px solid ${theme.border}`, 
              borderRadius: 16, 
              padding: 20,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 8, fontWeight: 500 }}>
                {t('dash.stats.current_level') || 'Текущий уровень'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  background: `${currentLevelColor}22`,
                  color: currentLevelColor,
                  border: `1px solid ${currentLevelColor}44`,
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "'Cormorant Garamond', serif",
                }}>
                  {maxLevel || '-'}
                </span>
                {stats.rankPosition && (
                  <div style={{ fontSize: 13, color: theme.muted }}>
                    #{stats.rankPosition} {t('dash.stats.ranking') || 'в рейтинге'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress by Level */}
          <div style={{ 
            background: theme.card, 
            border: `1px solid ${theme.border}`, 
            borderRadius: 16, 
            padding: 20, 
            marginBottom: 24 
          }}>
            <h4 style={{ 
              color: theme.text, 
              fontWeight: 600, 
              marginBottom: 16,
              fontSize: 15
            }}>
              {t('dash.stats.level_progress') || 'Прогресс по уровням'}
            </h4>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => {
                const count = stats.progressByLevel?.[level] || 0;
                const color = LEVEL_COLORS[level];
                const isActive = count > 0;
                return (
                  <div 
                    key={level}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: isActive ? `${color}18` : theme.panel,
                      border: `1px solid ${isActive ? color + '44' : theme.border}`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      transition: 'all 0.2s',
                      transform: isActive ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <span style={{
                      background: color,
                      color: '#fff',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                      {level}
                    </span>
                    <span style={{
                      color: isActive ? theme.text : theme.muted,
                      fontSize: 14,
                      fontWeight: 600,
                    }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ranking */}
          {stats.ranking && stats.ranking.length > 0 && (
            <div style={{ 
              background: theme.card, 
              border: `1px solid ${theme.border}`, 
              borderRadius: 16, 
              padding: 20 
            }}>
              <h4 style={{ 
                color: theme.text, 
                fontWeight: 600, 
                marginBottom: 16,
                fontSize: 15
              }}>
                🏆 {t('dash.stats.leaderboard') || 'Таблица лидеров'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.ranking.slice(0, 5).map((entry, index) => {
                  const isCurrentUser = entry.id === user?.id || entry.name === user?.name;
                  return (
                    <div 
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        background: isCurrentUser ? `${theme.gold}15` : 'transparent',
                        borderRadius: 8,
                        border: isCurrentUser ? `1px solid ${theme.gold}44` : '1px solid transparent',
                      }}
                    >
                      <span style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: index < 3 ? theme.gold : theme.panel,
                        color: index < 3 ? '#fff' : theme.muted,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}>
                        {index + 1}
                      </span>
                      <span style={{
                        flex: 1,
                        color: theme.text,
                        fontWeight: isCurrentUser ? 600 : 400,
                        fontSize: 14,
                      }}>
                        {entry.name}
                      </span>
                      <span style={{
                        color: theme.muted,
                        fontSize: 13,
                      }}>
                        {entry.examCount} exams
                      </span>
                      <span style={{
                        color: theme.gold,
                        fontWeight: 600,
                        fontSize: 14,
                      }}>
                        {entry.avgScore}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Certificates */}
        {hasCertificates && (
          <div style={{ 
            position: 'sticky',
            top: 24
          }}>
            <div style={{ 
              background: theme.card, 
              border: `1px solid ${theme.border}`, 
              borderRadius: 16, 
              padding: 20 
            }}>
              <h4 style={{ 
                color: theme.text, 
                fontWeight: 600, 
                marginBottom: 16,
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: 18 }}>🎓</span>
                {t('dash.stats.certificates') || 'Сертификаты'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.certificates.map(cert => {
                  const levelColor = LEVEL_COLORS[cert.level] || theme.gold;
                  return (
                    <div key={cert.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 14, 
                      padding: '14px 16px',
                      background: theme.panel,
                      borderRadius: 12,
                      border: `1px solid ${theme.border}`,
                    }}>
                      <div style={{ 
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `${levelColor}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                      }}>
                        ✓
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          color: theme.text, 
                          fontWeight: 600, 
                          fontSize: 14,
                          marginBottom: 4
                        }}>
                          {cert.examTitle}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            background: levelColor,
                            color: '#fff',
                            borderRadius: 4,
                            padding: '1px 6px',
                            fontSize: 10,
                            fontWeight: 700,
                          }}>
                            {cert.level}
                          </span>
                          <span style={{ color: theme.muted, fontSize: 12 }}>
                            {fmtDate(cert.submittedAt)}
                          </span>
                        </div>
                      </div>
                      <div style={{ 
                        color: levelColor, 
                        fontWeight: 700, 
                        fontSize: 18,
                        fontFamily: "'Cormorant Garamond', serif",
                      }}>
                        {cert.score}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsTab;
