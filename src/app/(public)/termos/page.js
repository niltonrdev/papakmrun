import Link from "next/link";
import { STRAVA_LEGAL } from "@/lib/strava/legal";

export const metadata = {
  title: "Termos de serviço | PapaKM",
  description: "Termos de uso da PapaKM e regras da conexão com o Strava.",
};

function Ext({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-papa-blue underline underline-offset-2 hover:text-white"
    >
      {children}
    </a>
  );
}

export default function TermosPage() {
  return (
    <main className="min-h-dvh bg-[#060b14] text-slate-100">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">PapaKM</p>
        <h1 className="mt-2 text-3xl font-black italic tracking-tight sm:text-4xl">
          Termos de serviço
        </h1>
        <p className="mt-3 text-sm text-white/50">Vigência: 18 de setembro de 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/75">
          <section>
            <h2 className="text-base font-black uppercase tracking-wide text-white">1. Quem somos</h2>
            <p className="mt-2">
              A PapaKM é uma plataforma de acompanhamento de treinos de corrida (planilha, check-ins,
              performance e comunidade). Ao criar conta ou usar o app, você concorda com estes Termos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-black uppercase tracking-wide text-white">2. Conta</h2>
            <p className="mt-2">
              Você é responsável pelos dados cadastrais e pela confidencialidade da senha. Use o
              serviço apenas se tiver idade e capacidade legal para contratar. Informações de saúde
              (como PAR-Q) são usadas para segurança do treino e avaliação do professor — não
              substituem consulta médica.
            </p>
          </section>

          <section>
            <h2 className="text-base font-black uppercase tracking-wide text-white">
              3. Planilha, check-ins e feed
            </h2>
            <p className="mt-2">
              Check-ins de treino da planilha (distância prevista, esforço, observação e foto, se você
              enviar) podem aparecer no feed da comunidade para outros alunos autenticados. Fotos e
              textos que você publica são de sua responsabilidade. Não publique conteúdo ofensivo ou
              de terceiros sem autorização.
            </p>
          </section>

          <section>
            <h2 className="text-base font-black uppercase tracking-wide text-white">
              4. Integração com o Strava
            </h2>
            <p className="mt-2">
              Conectar o Strava é opcional. Se você autorizar, a PapaKM solicita ao Strava permissão
              para ler seu perfil público, seu perfil completo e suas atividades (incluindo
              privadas), conforme a tela de autorização.
            </p>
            <p className="mt-2">
              Usamos esses dados só para o seu uso no app: volume, evolução, mural pessoal e
              estatísticas. Dados de atividades do Strava <strong className="text-white/90">não são
              exibidos no feed para outros alunos</strong>.
            </p>
            <p className="mt-2">
              Você pode desligar a conexão em Perfil → Strava, ou revogar o app nas{" "}
              <Ext href={STRAVA_LEGAL.settingsApps}>configurações do Strava</Ext>.
            </p>
            <p className="mt-2">
              O Strava é um serviço independente. O uso do Strava continua sujeito aos documentos
              oficiais deles:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <Ext href={STRAVA_LEGAL.terms}>Termos de serviço do Strava</Ext>
              </li>
              <li>
                <Ext href={STRAVA_LEGAL.privacy}>Política de privacidade do Strava</Ext>
              </li>
              <li>
                <Ext href={STRAVA_LEGAL.apiAgreement}>Contrato de uso da API do Strava</Ext>
              </li>
              <li>
                <Ext href={STRAVA_LEGAL.apiPolicy}>Política da API do Strava</Ext>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-black uppercase tracking-wide text-white">5. Privacidade</h2>
            <p className="mt-2">
              Guardamos o necessário para operar a conta, a planilha e, se conectado, tokens e
              resumos de atividade do Strava. Não vendemos seus dados. Professores e administradores
              da PapaKM podem ver treinos e check-ins para acompanhar o grupo. Pedidos de exclusão
              de conta ou dados podem ser feitos ao suporte da PapaKM.
            </p>
          </section>

          <section>
            <h2 className="text-base font-black uppercase tracking-wide text-white">6. Limites</h2>
            <p className="mt-2">
              O app é oferecido “como está”. Treinos, ritmos e volumes são orientações esportivas, não
              prescrição médica. A PapaKM não se responsabiliza por lesões, interrupções do Strava ou
              uso indevido da sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-base font-black uppercase tracking-wide text-white">7. Alterações</h2>
            <p className="mt-2">
              Podemos atualizar estes Termos. A versão vigente fica nesta página. O uso contínuo após
              a publicação significa aceite da nova versão.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-white/40">
          <Link href="/login" className="text-papa-blue hover:underline">
            Voltar ao login
          </Link>
          <span className="mx-2">·</span>
          <Link href="/perfil" className="text-papa-blue hover:underline">
            Ir ao perfil
          </Link>
        </p>
      </div>
    </main>
  );
}
