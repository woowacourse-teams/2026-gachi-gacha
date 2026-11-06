import TradeForm from './components/TradeForm';
import TradeFormLayout from './components/TradeFormLayout';

export default function TradeCreatePage() {
  return (
    <TradeFormLayout
      title="글쓰기"
      backTo="/trade"
      backLabel="거래 목록으로 돌아가기"
    >
      <TradeForm />
    </TradeFormLayout>
  );
}
