'use client';

import { useState, useEffect } from 'react';
import HomeStep from './steps/HomeStep';
import MembersStep from './steps/MembersStep';
import PetsStep from './steps/PetsStep';
import ChoresStep from './steps/ChoresStep';
import { submitOnboarding } from '@/app/actions/onboarding';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState({
    homeName: '',
    members: [] as any[],
    pets: [] as any[],
    chores: [] as any[]
  });

  useEffect(() => {
    const checkHomes = async () => {
      const { count, error } = await supabase
        .from('homes')
        .select('*', { count: 'exact', head: true });

      if (count && count > 0) {
        // If home exists, only organizator can be here
        if (currentUser?.role !== 'organizator') {
          router.replace('/');
          return;
        }
      }
      setLoading(false);
    };

    checkHomes();
  }, [currentUser, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] dark:bg-[#1E1E1E] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3584E4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nextStep = (stepData: any) => {
    setData({ ...data, ...stepData });
    setStep(step + 1);
  };

  const backStep = () => {
    setStep(step - 1);
  };

  const finish = async (chores: any[]) => {
    const finalData = { ...data, chores };
    setIsSubmitting(true);
    try {
      await submitOnboarding(finalData);
    } catch (error) {
      console.error(error);
      alert('Error al guardar. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-[#1E1E1E] flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#303030] rounded-[32px] shadow-xl overflow-hidden border border-[#E5E6E6] dark:border-[#3D3D3D]">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-[#E5E6E6] dark:bg-[#3D3D3D]">
          <div 
            className="h-full bg-[#3584E4] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8">
          {step === 1 && (
            <HomeStep 
              data={{ homeName: data.homeName }} 
              onNext={(d) => nextStep(d)} 
            />
          )}
          {step === 2 && (
            <MembersStep 
              data={data.members} 
              onNext={(members) => nextStep({ members })} 
              onBack={backStep} 
            />
          )}
          {step === 3 && (
            <PetsStep 
              data={data.pets} 
              onNext={(pets) => nextStep({ pets })} 
              onBack={backStep} 
            />
          )}
          {step === 4 && (
            <ChoresStep 
              data={data.chores} 
              pets={data.pets}
              onFinish={finish} 
              onBack={backStep}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
      
      <p className="mt-8 text-sm text-[#1E1E1E]/40 dark:text-white/30 font-medium">
        Otelo — Gestión Inteligente del Hogar
      </p>
    </div>
  );
}
