import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Ocorrencia, OcorrenciasData } from '@/types/Ocorrencia';

export interface OcorrenciasDataComRefetch extends OcorrenciasData {
  refetch: () => void;
}

/**
 * Hook que busca ocorrências de um aeroporto específico
 *
 * ✅ CORRIGIDO: Agora trata o caso de icaoFiltro ser null/undefined
 * Isso resolve a violação de Rules of Hooks
 */
export function useOcorrenciasAeroporto(icaoFiltro: string | null | undefined): OcorrenciasDataComRefetch {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    // ✅ Se icaoFiltro é null/undefined, retornar estado vazio
    if (!icaoFiltro) {
      console.log('%c📊 useOcorrenciasAeroporto: icao não definido, retornando vazio', 'color: #94a3b8');
      setOcorrencias([]);
      setIsLoading(false);
      return;
    }

    console.log(`%c🔍 useOcorrenciasAeroporto: Buscando ocorrências para ${icaoFiltro}`, 'color: #3b82f6; font-weight: bold');

    const fetchOcorrencias = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('ocorrencia')
          .select('*')
          .eq('aeroporto_icao', icaoFiltro)
          .order('data', { ascending: false });

        if (error) {
          console.error(`%c❌ Erro ao buscar ocorrências para ${icaoFiltro}:`, 'color: #ef4444', error);
          setOcorrencias([]);
        } else {
          // Mapear dados com valores padrão para campos obrigatórios
          const ocorrenciasComDefaults = (data || []).map((item: any) => ({
            id: item.id,
            aeroporto_icao: item.aeroporto_icao,
            icao: item.aeroporto_icao, // Usar icao como alias
            tipo: item.tipo || 'indefinido',
            titulo: item.titulo,
            severidade: item.severidade || 'media' as const, // Padrão: média
            descricao: item.descricao || '',
            data: item.data,
            hora: item.hora,
            status: item.status || 'ativa' as const, // Padrão: ativa
            dataInicio: item.dataInicio,
            dataFim: item.dataFim,
            responsavel: item.responsavel,
            impacto: item.impacto,
            observacoes: item.observacoes,
          } as Ocorrencia));

          console.log(`%c✅ Ocorrências carregadas para ${icaoFiltro}: ${data?.length || 0}`, 'color: #22c55e', data);
          setOcorrencias(ocorrenciasComDefaults);
        }
      } catch (err) {
        console.error(`%c❌ Erro ao buscar ocorrências para ${icaoFiltro}:`, 'color: #ef4444', err);
        setOcorrencias([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOcorrencias();
  }, [icaoFiltro, versao]);

  const refetch = useCallback(() => setVersao((v) => v + 1), []);

  // ✅ Agora retorna sempre com icao definido (ou 'todas')
  const data: OcorrenciasDataComRefetch = {
    icao: icaoFiltro || 'todas',
    ocorrencias,
    total: ocorrencias.length,
    isLoading,
    refetch,
  };

  return data;
}

/**
 * Hook alternativo que busca ocorrências com filtros adicionais
 * Mantém a mesma interface para não quebrar código existente
 */
export function useOcorrencias(icaoFiltro?: string | null) {
  return useOcorrenciasAeroporto(icaoFiltro || null);
}
