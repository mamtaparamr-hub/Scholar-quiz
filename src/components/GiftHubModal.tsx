import React, { useState } from 'react';
import { X, Gift, Heart, Send, Sparkles, Check, Copy, UserPlus, Shield, Zap, Magnet, Award } from 'lucide-react';
import { StorageService, GIFT_ITEMS } from '../services/storage';
import { Classmate, PlayerStats, GiftHistoryEntry, ActiveBooster } from '../types/game';
import { soundEngine } from '../services/audio';

interface GiftHubModalProps {
  playerStats: PlayerStats;
  onClose: () => void;
  onStatsUpdated: (stats: PlayerStats) => void;
}

export const GiftHubModal: React.FC<GiftHubModalProps> = ({
  playerStats,
  onClose,
  onStatsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'classmates' | 'vouchers' | 'history'>('classmates');
  const [classmates, setClassmates] = useState<Classmate[]>(StorageService.getClassmates());
  const [selectedClassmateId, setSelectedClassmateId] = useState<string>(classmates[0]?.id || '');
  const [giftAmount, setGiftAmount] = useState<number>(50);
  const [selectedItemId, setSelectedItemId] = useState<string>(GIFT_ITEMS[0].id);
  const [customNote, setCustomNote] = useState<string>('Keep up the brilliant creative work in the lab!');
  const [giftFeedback, setGiftFeedback] = useState<{ text: string; type: 'success' | 'error'; booster?: ActiveBooster; reply?: string } | null>(null);

  // Voucher generation & redemption state
  const [voucherAmount, setVoucherAmount] = useState<number>(50);
  const [voucherSender, setVoucherSender] = useState<string>('Alex');
  const [voucherNote, setVoucherNote] = useState<string>('Enjoy these Spark Coins for your inventions!');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [redeemInput, setRedeemInput] = useState<string>('');
  const [redeemResult, setRedeemResult] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Add custom buddy state
  const [showAddBuddyModal, setShowAddBuddyModal] = useState<boolean>(false);
  const [buddyName, setBuddyName] = useState<string>('');
  const [buddyRole, setBuddyRole] = useState<string>('');
  const [buddyBio, setBuddyBio] = useState<string>('');

  const selectedClassmate = classmates.find((c) => c.id === selectedClassmateId) || classmates[0];
  const selectedItem = GIFT_ITEMS.find((i) => i.id === selectedItemId) || GIFT_ITEMS[0];
  const totalCost = giftAmount + selectedItem.cost;

  // Handle gift submission
  const handleSendGift = () => {
    if (!selectedClassmate) return;
    const res = StorageService.giftCoins(selectedClassmate.id, giftAmount, selectedItemId, customNote);

    if (res.success) {
      soundEngine.playGiftSent();
      const updatedStats = StorageService.getStats();
      const updatedClassmates = StorageService.getClassmates();
      setClassmates(updatedClassmates);
      onStatsUpdated(updatedStats);
      setGiftFeedback({
        text: res.message,
        type: 'success',
        booster: res.booster,
        reply: res.reply,
      });
    } else {
      soundEngine.playImpact();
      setGiftFeedback({
        text: res.message,
        type: 'error',
      });
    }
  };

  // Handle voucher creation
  const handleGenerateVoucher = () => {
    const res = StorageService.createGiftVoucher(voucherSender, voucherAmount, voucherNote);
    if (res.success && res.code) {
      soundEngine.playGiftSent();
      setGeneratedCode(res.code);
      setCopiedCode(false);
      onStatsUpdated(StorageService.getStats());
    } else {
      soundEngine.playImpact();
      alert(res.error || 'Failed to create gift voucher');
    }
  };

  // Handle voucher redemption
  const handleRedeem = () => {
    if (!redeemInput.trim()) return;
    const res = StorageService.redeemGiftCode(redeemInput);
    if (res.success) {
      soundEngine.playVictory();
      setRedeemResult({
        text: `Redeemed +${res.amount} Spark Coins from ${res.sender}! "${res.message}"`,
        type: 'success',
      });
      setRedeemInput('');
      onStatsUpdated(StorageService.getStats());
    } else {
      soundEngine.playImpact();
      setRedeemResult({
        text: res.error || 'Invalid code',
        type: 'error',
      });
    }
  };

  // Add custom classmate
  const handleAddBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buddyName.trim()) return;
    const newBuddy = StorageService.addCustomClassmate(buddyName, buddyRole, buddyBio);
    soundEngine.playSuccess();
    const updated = StorageService.getClassmates();
    setClassmates(updated);
    setSelectedClassmateId(newBuddy.id);
    setShowAddBuddyModal(false);
    setBuddyName('');
    setBuddyRole('');
    setBuddyBio('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Classmate & Peer Gift Hub</h2>
              <p className="text-xs text-slate-400">Collaborate, send coins & artifacts, and unlock synergy perks</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Spark Coins Balance */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold tabular-nums">
              <span>🪙</span>
              <span>{playerStats.coins} Coins</span>
            </div>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 shrink-0 bg-slate-950/40">
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('classmates');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'classmates'
                ? 'border-sky-500 text-sky-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Gift to Classmates ({classmates.length})
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('vouchers');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'vouchers'
                ? 'border-sky-500 text-sky-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Shareable Gift Codes & Redeem
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('history');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'border-sky-500 text-sky-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Gift Log & Boosters ({playerStats.activeBoosters.length})
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'classmates' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Classmate Selection List */}
              <div className="lg:col-span-5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classmate Roster</span>
                  <button
                    onClick={() => setShowAddBuddyModal(true)}
                    className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Real Buddy</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                  {classmates.map((c) => {
                    const isSelected = c.id === selectedClassmateId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedClassmateId(c.id);
                          setGiftFeedback(null);
                        }}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold shrink-0 text-sky-400">
                          {c.name.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold truncate">{c.name}</h4>
                            <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                              <Heart className="w-3 h-3 fill-amber-400" />
                              <span className="tabular-nums font-semibold">{c.friendshipLevel}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{c.role}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">Needs: {c.wishlist}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gift Configuration Panel */}
              <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-xl bg-slate-950/80 border border-slate-800">
                {selectedClassmate ? (
                  <div className="flex flex-col gap-4">
                    {/* Selected Classmate Bio & Current Perk */}
                    <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-sky-400">{selectedClassmate.name}</span>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          Total Received: {selectedClassmate.coinsReceived} coins
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 italic mb-2">"{selectedClassmate.personalBio}"</p>

                      {/* Reciprocal Booster Highlight */}
                      {selectedClassmate.giftRewardBooster && (
                        <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1.5 rounded-md">
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Awards Booster:{' '}
                            <strong className="text-white">{selectedClassmate.giftRewardBooster.name}</strong> (
                            {selectedClassmate.giftRewardBooster.description})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Step 1: Select Coins to Gift */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        1. Choose Coins to Send
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[25, 50, 100, 200].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => {
                              soundEngine.playClick();
                              setGiftAmount(amt);
                            }}
                            className={`py-2 px-3 rounded-lg border text-xs font-bold tabular-nums transition-colors ${
                              giftAmount === amt
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            🪙 {amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Select Creative Gift Item */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        2. Attach an Invention Artifact
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {GIFT_ITEMS.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              soundEngine.playClick();
                              setSelectedItemId(item.id);
                            }}
                            className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-colors ${
                              selectedItemId === item.id
                                ? 'bg-sky-500/10 border-sky-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{item.name}</p>
                              <p className="text-[10px] text-amber-400 font-semibold tabular-nums">+{item.cost} Coins</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 3: Personalized Note */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        3. Add Encouraging Note
                      </label>
                      <input
                        type="text"
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="Say something inspiring to your classmate..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    {/* Feedback Alert */}
                    {giftFeedback && (
                      <div
                        className={`p-3 rounded-lg text-xs leading-relaxed border ${
                          giftFeedback.type === 'success'
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-red-950/40 border-red-500/40 text-red-300'
                        }`}
                      >
                        <p className="font-semibold mb-1">{giftFeedback.text}</p>
                        {giftFeedback.reply && (
                          <p className="italic text-slate-300 text-[11px]">{giftFeedback.reply}</p>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                      <div className="text-xs text-slate-400 tabular-nums">
                        Total Gift Cost: <strong className="text-amber-400 font-bold">{totalCost} Coins</strong>
                      </div>

                      <button
                        onClick={handleSendGift}
                        disabled={playerStats.coins < totalCost}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                          playerStats.coins >= totalCost
                            ? 'bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Gift Package</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {activeTab === 'vouchers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generate Gift Voucher */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Package Coins into Shareable Voucher Code</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Generate an encrypted gift code to copy and give to a real-life school classmate or friend. They can paste it below to claim the coins!
                  </p>

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Your Name</label>
                      <input
                        type="text"
                        value={voucherSender}
                        onChange={(e) => setVoucherSender(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Coins to Package</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[50, 100, 200].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => {
                              soundEngine.playClick();
                              setVoucherAmount(amt);
                            }}
                            className={`py-2 px-2 rounded-lg border text-xs font-bold tabular-nums ${
                              voucherAmount === amt
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            🪙 {amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Gift Message</label>
                      <input
                        type="text"
                        value={voucherNote}
                        onChange={(e) => setVoucherNote(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800">
                  <button
                    onClick={handleGenerateVoucher}
                    disabled={playerStats.coins < voucherAmount}
                    className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-xs transition-colors shadow-md"
                  >
                    Generate Code ({voucherAmount} Coins)
                  </button>

                  {generatedCode && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-amber-300/80 block">Shareable Gift Code:</span>
                        <span className="font-mono font-bold text-sm text-amber-300 tracking-wider">
                          {generatedCode}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          navigator.clipboard.writeText(generatedCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Redeem Gift Voucher */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                    <Gift className="w-4 h-4 text-emerald-400" />
                    <span>Redeem a Received Gift Code</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Have a code from a study buddy or instructor? Paste it here to claim coins! Try starter code:{' '}
                    <code className="text-sky-400 font-mono font-semibold">WELCOME-SPARK-100</code>
                  </p>

                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={redeemInput}
                      onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
                      placeholder="e.g. GIFT-SPARK-XXXX or WELCOME-SPARK-100"
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-sm uppercase text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />

                    {redeemResult && (
                      <div
                        className={`p-3 rounded-lg text-xs leading-relaxed border ${
                          redeemResult.type === 'success'
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-red-950/40 border-red-500/40 text-red-300'
                        }`}
                      >
                        {redeemResult.text}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800">
                  <button
                    onClick={handleRedeem}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-md"
                  >
                    Redeem Coins
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="flex flex-col gap-6">
              {/* Active Boosters Received from Friends */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Active Peer Synergy Boosters</span>
                </h3>
                {playerStats.activeBoosters.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-950 border border-slate-800">
                    No active boosters yet. Gift coins to your classmates to receive their custom invention gadgets!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {playerStats.activeBoosters.map((b) => (
                      <div key={b.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                          {b.effect === 'speed' && <Zap className="w-4 h-4" />}
                          {b.effect === 'magnet' && <Magnet className="w-4 h-4" />}
                          {b.effect === 'shield' && <Shield className="w-4 h-4" />}
                          {b.effect === 'bonus_coins' && <Award className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{b.name}</h4>
                            <span className="text-[10px] text-slate-400">from {b.fromFriend}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">{b.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gift Log History */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Recent Gifts Given</h3>
                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
                  {StorageService.getGiftHistory().length === 0 ? (
                    <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-950 border border-slate-800">
                      No gifts sent yet. Start by sending a care package to Mia, Leo, or Zoe!
                    </p>
                  ) : (
                    StorageService.getGiftHistory().map((g) => (
                      <div key={g.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-white font-semibold">Gifted to {g.recipientName}</span>
                          <span className="text-slate-500 mx-2">·</span>
                          <span className="text-slate-400">{g.giftItemName}</span>
                          <p className="text-[11px] text-slate-500 italic mt-0.5">"{g.customNote}"</p>
                        </div>
                        <div className="text-right tabular-nums">
                          <span className="text-amber-400 font-bold">-{g.amount} coins</span>
                          {g.reciprocatedBooster && (
                            <span className="block text-[10px] text-emerald-400">+{g.reciprocatedBooster}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Classmate Modal */}
      {showAddBuddyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <form
            onSubmit={handleAddBuddy}
            className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col gap-4 text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add Real Classmate / Study Buddy</h3>
              <button
                type="button"
                onClick={() => setShowAddBuddyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Classmate Name</label>
              <input
                type="text"
                required
                value={buddyName}
                onChange={(e) => setBuddyName(e.target.value)}
                placeholder="e.g. Jordan Smith"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Specialty / Interest</label>
              <input
                type="text"
                value={buddyRole}
                onChange={(e) => setBuddyRole(e.target.value)}
                placeholder="e.g. Solar Physics Enthusiast"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Short Bio / What they are building</label>
              <input
                type="text"
                value={buddyBio}
                onChange={(e) => setBuddyBio(e.target.value)}
                placeholder="e.g. Designing a miniature wind turbine for the science fair"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddBuddyModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
              >
                Add to Roster
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
