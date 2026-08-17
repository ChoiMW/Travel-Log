import React, { useState } from 'react';
import { CheckSquare, Square, Plus, Trash2, Calculator, Wallet, Sparkles, Luggage, Users, Receipt } from 'lucide-react';

interface PackingItem {
  id: string;
  text: string;
  category: string;
  checked: boolean;
}

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
}

export const TravelPocketView: React.FC = () => {
  const [subTab, setSubTab] = useState<'packing' | 'expense'>('packing');

  // 1. 짐싸기 체크리스트 상태
  const [packingList, setPackingList] = useState<PackingItem[]>([
    { id: '1', text: '신분증 & 운전면허증', category: '필수', checked: true },
    { id: '2', text: '스마트폰 고속 충전기 & 보조배터리', category: '전자기기', checked: true },
    { id: '3', text: '세면도구 & 스킨케어 키트', category: '생활용품', checked: false },
    { id: '4', text: '비상 상비약 (소화제, 타이레놀, 밴드)', category: '건강', checked: false },
    { id: '5', text: '여벌 옷 & 양말 (2박용)', category: '의류', checked: false },
    { id: '6', text: '삼각대 & 카메라', category: '전자기기', checked: false },
  ]);
  const [newPackingText, setNewPackingText] = useState('');

  // 2. 가계부 & 1/N 정산 상태
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 'e1', title: 'KTX 기차표 왕복', amount: 98000, category: '교통' },
    { id: 'e2', title: '해운대 오션뷰 에어비앤비', amount: 160000, category: '숙소' },
    { id: 'e3', title: '자갈치시장 회 & 매운탕 저녁', amount: 85000, category: '식비' },
    { id: 'e4', title: '광안리 해변 오션뷰 카페', amount: 24000, category: '카페' },
  ]);
  const [peopleCount, setPeopleCount] = useState<number>(3); // 3명 1/N 정산
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  const toggleCheck = (id: string) => {
    setPackingList(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const addPackingItem = () => {
    if (!newPackingText.trim()) return;
    setPackingList(prev => [...prev, { id: `p_${Date.now()}`, text: newPackingText.trim(), category: '기타', checked: false }]);
    setNewPackingText('');
  };

  const deletePackingItem = (id: string) => {
    setPackingList(prev => prev.filter(item => item.id !== id));
  };

  const addExpenseItem = () => {
    const amt = parseInt(newExpenseAmount, 10);
    if (!newExpenseTitle.trim() || isNaN(amt) || amt <= 0) return;
    setExpenses(prev => [...prev, { id: `e_${Date.now()}`, title: newExpenseTitle.trim(), amount: amt, category: '기타' }]);
    setNewExpenseTitle('');
    setNewExpenseAmount('');
  };

  const deleteExpenseItem = (id: string) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
  };

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const perPersonAmount = peopleCount > 0 ? Math.round(totalExpense / peopleCount) : 0;
  const packedCount = packingList.filter(i => i.checked).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '750px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* 상단 배너 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
          color: 'white',
          borderRadius: '26px',
          padding: '24px 28px',
          boxShadow: '0 10px 30px rgba(79, 70, 229, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 800, color: '#c7d2fe' }}>
            <Sparkles size={16} />
            <span>PROTOTYPE C • TRAVEL POCKET UTILITY</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px' }}>
            올인원 여행 포켓 (짐싸기 & 1/N 가계부)
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#e0e7ff', marginTop: '2px' }}>
            여행 갈 때마다 빠뜨리는 짐 없이 챙기고, 친구들과 여행 경비를 깔끔하게 정산하세요.
          </p>
        </div>

        {/* 탭 스위치 */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', padding: '4px', borderRadius: '16px' }}>
          <button
            onClick={() => setSubTab('packing')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              background: subTab === 'packing' ? '#ffffff' : 'transparent',
              color: subTab === 'packing' ? '#3730a3' : '#ffffff',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
            }}
          >
            🧳 짐싸기 ({packedCount}/{packingList.length})
          </button>
          <button
            onClick={() => setSubTab('expense')}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              background: subTab === 'expense' ? '#ffffff' : 'transparent',
              color: subTab === 'expense' ? '#3730a3' : '#ffffff',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
            }}
          >
            💰 1/N 정산 가계부
          </button>
        </div>
      </div>

      {/* 1. 짐싸기 체크리스트 서브 뷰 */}
      {subTab === 'packing' && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '26px',
            padding: '24px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              여행 짐싸기 체크리스트
            </h3>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#4f46e5' }}>
              {Math.round((packedCount / (packingList.length || 1)) * 100)}% 짐싸기 완료
            </span>
          </div>

          {/* 항목 추가 인풋 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="추가할 준비물 입력 (예: 선글라스, 방수팩 등)"
              value={newPackingText}
              onChange={e => setNewPackingText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPackingItem()}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
                outline: 'none',
              }}
            />
            <button className="btn btn-primary" style={{ background: '#4f46e5' }} onClick={addPackingItem}>
              <Plus size={16} />
              <span>추가</span>
            </button>
          </div>

          {/* 체크리스트 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {packingList.map(item => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: item.checked ? 'var(--bg-hover)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: item.checked ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {item.checked ? (
                    <CheckSquare size={20} color="#4f46e5" />
                  ) : (
                    <Square size={20} color="var(--text-muted)" />
                  )}
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, textDecoration: item.checked ? 'line-through' : 'none', color: 'var(--text-main)' }}>
                    {item.text}
                  </span>
                </div>

                <button
                  onClick={e => { e.stopPropagation(); deletePackingItem(item.id); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. 1/N 정산 가계부 서브 뷰 */}
      {subTab === 'expense' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 상단 1/N 정산 요약 카드 */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              color: 'white',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', color: '#c7d2fe', fontWeight: 700 }}>총 여행 지출 합계</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '2px' }}>
                {totalExpense.toLocaleString()}원
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', fontSize: '0.82rem', color: '#c7d2fe' }}>
                <Users size={14} />
                <span>총 <b>{peopleCount}명</b> 정산 시 1인당</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
                {perPersonAmount.toLocaleString()}원
              </div>
            </div>
          </div>

          {/* 지출 내역 관리 */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: '26px', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                지출 항목 목록 ({expenses.length}건)
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>정산 인원:</span>
                <select
                  value={peopleCount}
                  onChange={e => setPeopleCount(parseInt(e.target.value, 10))}
                  style={{ padding: '6px 12px', borderRadius: '10px', background: 'var(--bg-hover)', color: 'var(--text-main)', border: 'none', fontWeight: 800 }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}명</option>)}
                </select>
              </div>
            </div>

            {/* 지출 추가 인풋 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="지출 항목 (예: 렌트카, 맛집)"
                value={newExpenseTitle}
                onChange={e => setNewExpenseTitle(e.target.value)}
                style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-main)', outline: 'none' }}
              />
              <input
                type="number"
                placeholder="금액 (원)"
                value={newExpenseAmount}
                onChange={e => setNewExpenseAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addExpenseItem()}
                style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-main)', outline: 'none' }}
              />
              <button className="btn btn-primary" style={{ background: '#4f46e5' }} onClick={addExpenseItem}>
                <Plus size={16} />
              </button>
            </div>

            {/* 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {expenses.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: 'var(--bg-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.74rem', background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-main)' }}>
                      {item.amount.toLocaleString()}원
                    </span>
                    <button onClick={() => deleteExpenseItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
