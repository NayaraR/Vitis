// Gerado por scripts/sync-mosto.mjs a partir de mosto/source/. Não edite à mão.
import type * as React from "react";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, ChangeEventHandler } from 'react';

/** Nome de um ícone do Mosto incluído no bundle. */
export type IconName = 'check' | 'minus' | 'plus' | 'circle-alert' | 'info' | 'heart' | 'shopping-bag' | 'x' | 'search' | 'chevron-down' | 'trash' | 'chevron-left' | 'share-2' | 'ellipsis-vertical' | 'menu' | 'shopping-cart' | 'loader' | 'chevrons-up-down' | 'arrow-left' | 'chevron-right' | 'circle-help' | 'facebook' | 'gift' | 'instagram' | 'layout-grid' | 'mail' | 'map-pin' | 'message-circle' | 'shield-check' | 'star' | 'sun' | 'ticket-percent' | 'trophy' | 'user' | 'whatsapp' | 'youtube' | 'festivos' | 'location-edit' | 'evino-box';

export interface IconProps {
  name: IconName;
  /** Lado em px. Padrão 24; o componente pai costuma ajustar (16 no Button, 12 no Badge). */
  size?: number;
  /** Texto para leitores de tela; sem ele o ícone é decorativo. */
  label?: string;
  className?: string;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: ação principal (1 por contexto). cta: compra e conversão. secondary/outline: alternativas. ghost: baixo destaque. destructive: irreversível. */
  variant?: 'primary' | 'cta' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** default 40 px · small 36 · mini 26 · large 44 · xl 52 (botão dos apps). */
  size?: 'default' | 'small' | 'mini' | 'large' | 'xl';
  leftIcon?: IconName | ReactNode;
  rightIcon?: IconName | ReactNode;
  children?: ReactNode;
}

export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'alert' | 'informative' | 'neutral' | 'accent' | 'premium';
  /** Roundness=Round: pílula (radius-full). */
  round?: boolean;
  leftIcon?: IconName | ReactNode;
  rightIcon?: IconName | ReactNode;
  children?: ReactNode;
  className?: string;
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** regular 36 px · large 40 · small 32 · mini 24 (texto de 12 px). */
  size?: 'regular' | 'large' | 'small' | 'mini';
  /** Estado Error: borda e anel de foco de erro. */
  error?: boolean;
  /** Texto de ajuda abaixo do campo (text-muted). */
  helperText?: ReactNode;
  leftIcon?: IconName | ReactNode;
  rightIcon?: IconName | ReactNode;
}

export interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  onChange?: ChangeEventHandler<HTMLInputElement>;
  label?: ReactNode;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export interface AlertProps {
  /** neutral: informativo. error: erro (título e ícone em destructive). */
  type?: 'neutral' | 'error';
  title: ReactNode;
  description?: ReactNode;
  /** Ícone à esquerda; null esconde. Padrão: info (neutral) ou circle-alert (error). */
  icon?: IconName | ReactNode | null;
  /** Ação à direita, normalmente um Button outline. */
  action?: ReactNode;
  className?: string;
}

export interface QuantitySelectorProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Quantidade mínima (padrão 1): no mínimo, o botão menos fica desabilitado. */
  min?: number;
  max?: number;
  /** default 40 px · small 30 px. */
  size?: 'default' | 'small';
  /** Produto indisponível. */
  disabled?: boolean;
  label?: string;
  className?: string;
}

export interface CardProps {
  /** Título do cabeçalho (paragraph bold, text-strong). */
  title?: ReactNode;
  /** Descrição do cabeçalho (paragraph small, text-muted). */
  description?: ReactNode;
  /** Conteúdo do card. */
  children?: ReactNode;
  /** Rodapé: ações ou resumo, alinhados nas pontas. */
  footer?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface SwitchProps {
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface RadioProps {
  name?: string;
  value?: string;
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  label?: ReactNode;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export interface RadioOption {
  value: string;
  label: ReactNode;
  /** Linha 2 (só no rich). */
  description?: ReactNode;
  /** Preço (só no rich), por exemplo "R$ 19,90". */
  price?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  /** Rich Radio Group: cada opção vira um cartão com título, descrição e preço (ex.: opções de frete). */
  rich?: boolean;
  name?: string;
  /** Rótulo acessível do grupo. */
  label?: string;
  className?: string;
}

export interface SelectOption { value: string; label: ReactNode; }

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: Array<SelectOption | string>;
  /** Texto do estado Placeholder (opção vazia). */
  placeholder?: string;
  /** default 36 px · large 40. */
  size?: 'default' | 'large';
  error?: boolean;
}

export interface RatingProps {
  /** De 0 a 5, de meio em meio (arredonda para o meio mais próximo). */
  value: number;
  /** Número de avaliações, mostrado entre parênteses. */
  count?: number;
  /** default 16 px · small 12 px. */
  size?: 'default' | 'small';
  className?: string;
}

export interface ProductCardProps {
  name: ReactNode;
  /** Preço atual já formatado: "R$ 319,90". */
  price: ReactNode;
  /** Preço anterior riscado. */
  oldPrice?: ReactNode;
  /** Selo de desconto ao lado do preço anterior: "- 15%". */
  discount?: ReactNode;
  /** Etiqueta do topo (accent): "Oportunidade". */
  tag?: ReactNode;
  /** Selos redondos de pontuação ("WE\n92", "+4"). */
  scores?: ReactNode[];
  /** Benefício de assinante em primary-strong. Use <strong> para o trecho em destaque. */
  subscriberText?: ReactNode;
  /** URL da foto do produto (garrafa em fundo transparente). */
  image?: string;
  imageAlt?: string;
  /** 140 px (360) em vez de 180 px (1366). */
  mobile?: boolean;
  /** Variante Minimal para carrosséis: sem etiqueta, favorito e benefício. */
  minimal?: boolean;
  actionLabel?: string;
  onAdd?: () => void;
  onFavorite?: () => void;
  className?: string;
}

export interface CartProductProps {
  name: ReactNode;
  /** Valor sem o símbolo: "289,90" (o "R$" vem do componente). */
  price: ReactNode;
  /** Categoria e origem (Show category): "Tinto - Portugal". */
  category?: ReactNode;
  /** Promoção (Promotion) em primary: "Leve 3 por R$ 259,90 cada". */
  promotion?: ReactNode;
  image?: string;
  imageAlt?: string;
  quantity?: number;
  onQuantityChange?: (value: number) => void;
  onRemove?: () => void;
  /** Card=True: item solto com fundo, borda e padding. Card=False: linha dentro de uma lista. */
  card?: boolean;
  mobile?: boolean;
  className?: string;
}

export interface FreeShippingBarProps {
  /** progress: quanto falta, com barra e meta. zip: convite para buscar o CEP. club: benefício do clube (fundo primary-subtle). */
  type?: 'progress' | 'zip' | 'club';
  /** A mensagem. Use <strong> nos trechos em destaque ("R$ 50", "frete grátis"). */
  children: ReactNode;
  /** Cidade, mostrada num Badge outline ("São Paulo - SP"). */
  location?: ReactNode;
  /** progress: percentual da barra (0 a 100). */
  progress?: number;
  /** progress: meta ao lado da barra ("R$ 250"). */
  goal?: ReactNode;
  /** club: disponibilidade ("1/2 disponíveis"). */
  available?: ReactNode;
  /** zip: placeholder do campo. */
  placeholder?: string;
  onZipChange?: ChangeEventHandler<HTMLInputElement>;
  /** Mostra o botão de fechar. */
  onClose?: () => void;
  /** Layout de 360 px, em coluna. */
  mobile?: boolean;
  className?: string;
}

export interface TabItem { value: string; label?: ReactNode; icon?: IconName | ReactNode; counter?: ReactNode; disabled?: boolean; }

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  /** regular · large · small. */
  size?: 'regular' | 'large' | 'small';
  /** Rótulo acessível da lista de abas. */
  label?: string;
  className?: string;
}

export interface DialogProps {
  /** Título do cabeçalho (heading 4). */
  title: ReactNode;
  /** Conteúdo; o painel não põe padding nele: traga o seu (normalmente space-16). */
  children?: ReactNode;
  /** Ações do rodapé, alinhadas à direita (ex.: Button outline + Button primary). */
  footer?: ReactNode;
  onClose?: () => void;
  /** Mostra o voltar no cabeçalho. */
  onBack?: () => void;
  /** false esconde; o padrão é aberto. */
  open?: boolean;
  /** Renderiza só o painel, sem a camada de fundo (para prévias e composições). */
  inline?: boolean;
  /** Dialog mobile: 320 px, sem borda e sem raio. */
  mobile?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface SheetProps extends Omit<DialogProps, 'mobile'> {
  /** Borda de onde o painel sai. */
  side?: 'right' | 'left';
}

export interface TooltipProps {
  /** Texto curto da dica. */
  content: ReactNode;
  /** O elemento que recebe a dica (hover e foco). */
  children: ReactNode;
  side?: 'top' | 'bottom';
  /** Força aberto ou fechado (prévias). */
  open?: boolean;
}

export interface SkeletonProps {
  /** line 260×16 · object 260×132 · avatar 48 redondo. */
  variant?: 'line' | 'object' | 'avatar';
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export interface SonnerProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: IconName | ReactNode;
  /** Estado de carregamento: ícone loader girando. */
  loading?: boolean;
  /** Rótulo do botão de ação (Button secondary mini). */
  action?: ReactNode;
  onAction?: () => void;
  className?: string;
}

export interface Step { label: ReactNode; state?: 'upcoming' | 'current' | 'done' | 'canceled'; }

export interface StepsBarProps {
  steps: Step[];
  /** Mostra o círculo de 24 px com o número, o check (done) ou o x (canceled). */
  showMarker?: boolean;
  label?: string;
  className?: string;
}

export interface AppBarAction { icon: IconName; label: string; onClick?: () => void; }

export interface AppBarProps {
  /** back: voltar, título e até 2 ações. root: menu, logo da marca e carrinho. */
  type?: 'back' | 'root';
  title?: ReactNode;
  /** null esconde o voltar. */
  onBack?: (() => void) | null;
  actions?: AppBarAction[];
  /** Botão Ghost de texto à esquerda (substitui o voltar), ex.: "Cancelar". */
  leftTextAction?: ReactNode;
  onLeftTextAction?: () => void;
  /** Botão Ghost de texto à direita, ex.: "Salvar". */
  rightTextAction?: ReactNode;
  onRightTextAction?: () => void;
  onMenu?: () => void;
  onCart?: () => void;
  /** Fixa a marca do logo; sem ele, o logo segue o tema. */
  brand?: 'vissimo' | 'grandcru' | 'evino';
}

export interface LogoProps {
  /** Altura em px (padrão 20). */
  height?: number;
  /** Fixa a marca; sem ele, mostra a marca do tema (data-theme). */
  brand?: 'vissimo' | 'grandcru' | 'evino';
  /** Variante por fundo, como na library. brand: cores da marca, sobre a página e cards · on-color: em color-text-inverse, sobre a cor da marca e outras cores de papel · mono: uma cor, color-text-strong · on-inverse: em color-text-on-inverse, sobre color-surface-inverse (rodapés) · on-sidebar: em color-sidebar-text, na sidebar. Os nomes antigos default, positive e negative equivalem a brand, on-color e mono. */
  variant?: 'brand' | 'on-color' | 'mono' | 'on-inverse' | 'on-sidebar' | 'default' | 'positive' | 'negative';
  /** Símbolo mobile (quadrado; a Evino é horizontal) em vez do logotipo desktop. */
  mobile?: boolean;
  className?: string;
}

export declare function Icon(props: IconProps): React.JSX.Element;
export declare function Tabs(props: TabsProps): React.JSX.Element;
export declare function Dialog(props: DialogProps): React.JSX.Element | null;
export declare function Sheet(props: SheetProps): React.JSX.Element | null;
export declare function Tooltip(props: TooltipProps): React.JSX.Element;
export declare function Skeleton(props: SkeletonProps): React.JSX.Element;
export declare function Sonner(props: SonnerProps): React.JSX.Element;
export declare function StepsBar(props: StepsBarProps): React.JSX.Element;
export declare function AppBar(props: AppBarProps): React.JSX.Element;
export declare function Logo(props: LogoProps): React.JSX.Element;
export declare function Card(props: CardProps): React.JSX.Element;
export declare function Switch(props: SwitchProps): React.JSX.Element;
export declare function Radio(props: RadioProps): React.JSX.Element;
export declare function RadioGroup(props: RadioGroupProps): React.JSX.Element;
export declare function Select(props: SelectProps): React.JSX.Element;
export declare function Rating(props: RatingProps): React.JSX.Element;
export declare function ProductCard(props: ProductCardProps): React.JSX.Element;
export declare function CartProduct(props: CartProductProps): React.JSX.Element;
export declare function FreeShippingBar(props: FreeShippingBarProps): React.JSX.Element;
export declare function Button(props: ButtonProps): React.JSX.Element;
export declare function Badge(props: BadgeProps): React.JSX.Element;
export declare function Input(props: InputProps): React.JSX.Element;
export declare function Checkbox(props: CheckboxProps): React.JSX.Element;
export declare function Alert(props: AlertProps): React.JSX.Element;
export declare function QuantitySelector(props: QuantitySelectorProps): React.JSX.Element;

export interface MenuProps {
  /** Padding do contêiner (Spacing do Figma). Padrão: none. */
  spacing?: 'none' | '2' | '8' | '16' | '24';
  /** Rótulo acessível do menu. */
  label?: string;
  role?: string;
  id?: string;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface MenuItemProps {
  /** O texto do item (paragraph small). */
  children?: ReactNode;
  /** Linha 2, em text-muted. */
  description?: ReactNode;
  /** Ícone à esquerda (decoração de 20 px). */
  icon?: IconName | ReactNode;
  /** Ícone à direita, por exemplo chevron-right para submenu ou check para o selecionado. */
  rightIcon?: IconName | ReactNode | null;
  /** Atalho de teclado à direita, em text-muted ("⌘K"). */
  shortcut?: ReactNode;
  /** regular 32 px · large 36. */
  size?: 'regular' | 'large';
  /** Ação destrutiva: texto em color-destructive-default. */
  destructive?: boolean;
  selected?: boolean;
  /** Destaque de teclado (estado Focus do Figma). */
  active?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  onMouseEnter?: () => void;
  role?: 'menuitem' | 'option' | 'menuitemradio';
  id?: string;
  tabIndex?: number;
  className?: string;
}

export interface MenuLabelProps {
  children?: ReactNode;
  /** small (padrão, dentro de listas) · regular. */
  size?: 'small' | 'regular';
  /** Alinha o rótulo com itens que têm ícone à esquerda. */
  indented?: boolean;
  className?: string;
}

export interface ComboboxOption { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean; }

export interface ComboboxProps {
  options: Array<ComboboxOption | string>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Texto do gatilho sem valor (text-muted). */
  placeholder?: string;
  /** Placeholder do campo de busca. Padrão: "Buscar". */
  searchPlaceholder?: string;
  /** Texto quando a busca não encontra nada. Padrão: "Nenhum resultado". */
  emptyText?: string;
  /** default 36 px · large 40 · small 32 · mini 32 (texto de 12 px). */
  size?: 'default' | 'large' | 'small' | 'mini';
  error?: boolean;
  disabled?: boolean;
  /** Força aberto ou fechado (prévias). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Rótulo acessível do campo. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface DrawerProps {
  /** Título do cabeçalho (heading 4). Sem título, o cabeçalho some. */
  title?: ReactNode;
  children?: ReactNode;
  /** Ações do rodapé, distribuídas nas pontas (ex.: Button ghost + Button primary). */
  footer?: ReactNode;
  onClose?: () => void;
  /** Mostra o voltar (arrow-left) no cabeçalho. */
  onBack?: () => void;
  /** Borda de onde o painel sai. Padrão: bottom (com a alça de arrastar). */
  side?: 'bottom' | 'right' | 'left' | 'top';
  open?: boolean;
  /** Só o painel, sem a camada de fundo (prévias). */
  inline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface RichTooltipProps {
  /** O texto da dica (paragraph small). */
  content: ReactNode;
  /** Título opcional, em bold. */
  title?: ReactNode;
  /** Ações, normalmente Button ghost mini + Button primary mini. */
  actions?: ReactNode;
  /** Mostra o x de fechar. */
  onClose?: () => void;
  /** O elemento que recebe a dica (hover e foco). */
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Alinhamento com o elemento: default (centro), start ou end. */
  placement?: 'default' | 'start' | 'end';
  /** Força aberto ou fechado (prévias). */
  open?: boolean;
  className?: string;
}

export declare function Menu(props: MenuProps): React.JSX.Element;
export declare function MenuItem(props: MenuItemProps): React.JSX.Element;
export declare function MenuLabel(props: MenuLabelProps): React.JSX.Element;
export declare function MenuSeparator(props: { className?: string }): React.JSX.Element;
export declare function Combobox(props: ComboboxProps): React.JSX.Element;
export declare function Drawer(props: DrawerProps): React.JSX.Element | null;
export declare function RichTooltip(props: RichTooltipProps): React.JSX.Element;

export interface EcommerceMenusProps {
  /** Layout de 360 px (padrão: 1366). */
  mobile?: boolean;
  /** Fixa a marca; sem ele, mostra a camada da marca do tema. */
  brand?: 'vissimo' | 'grandcru' | 'evino';
  /** Número no contador da sacola ou do carrinho (padrão 3; 0 esconde). Grand Cru e Evino. */
  cartCount?: number;
  className?: string;
}

export interface FooterMenusProps {
  /** Layout de 360 px, com os grupos de links em acordeão (padrão: 1366). */
  mobile?: boolean;
  /** Fixa a marca; sem ele, mostra a camada da marca do tema. */
  brand?: 'vissimo' | 'grandcru' | 'evino';
  className?: string;
}

export declare function EcommerceMenus(props: EcommerceMenusProps): React.JSX.Element;
export declare function FooterMenus(props: FooterMenusProps): React.JSX.Element;

export interface EcommBaseTemplateProps {
  /** O conteúdo da página (slot Body). O template põe padding de 32 px (16 no mobile) e empilha em coluna. */
  children?: ReactNode;
  /** Layout de 360 px; o padrão ocupa a largura do contêiner (desenhe em 1366). */
  mobile?: boolean;
  /** false esconde o cabeçalho (Show menu do Figma). Padrão true. */
  showMenu?: boolean;
  /** Fixa a marca do cabeçalho e do rodapé; sem ele, seguem o tema. */
  brand?: 'vissimo' | 'grandcru' | 'evino';
  /** Contador da sacola ou do carrinho no cabeçalho (padrão 3). */
  cartCount?: number;
  className?: string;
  style?: React.CSSProperties;
}

export declare function EcommBaseTemplate(props: EcommBaseTemplateProps): React.JSX.Element;

export interface PriceProps {
  /** Preço "por", já formatado: "R$ 399,90". */
  price: ReactNode;
  /** Preço "de", riscado. */
  originalPrice?: ReactNode;
  /** Selo de desconto (Badge success): "-15%". */
  discount?: ReactNode;
  /** Preço por garrafa nos kits: "R$ 69,90 por garrafa". */
  unitPrice?: ReactNode;
  /** Parcelamento: "ou 3x de R$ 133,30 sem juros". */
  installments?: ReactNode;
  /** Preço de assinante, em primary-strong: "Assinante paga R$ 299,90". */
  subscriberPrice?: ReactNode;
  /** default (PDP, preço em heading 3) · small (cards e barras, preço em paragraph large medium). */
  size?: 'default' | 'small';
  className?: string;
}

export interface AwardProps {
  /** score: nota de crítico num círculo (sigla + nota). seal: selo de premiação em imagem. */
  type?: 'score' | 'seal';
  /** Sigla do crítico: "WE", "RP", "JS". */
  source?: ReactNode;
  score?: ReactNode;
  /** Legenda ao lado: "92 pontos Wine Enthusiast". */
  label?: ReactNode;
  /** URL da imagem do selo (type seal). */
  sealImage?: string;
  sealAlt?: string;
  /** default 40 px · large 72 px. */
  size?: 'default' | 'large';
  /** Só no score: default (círculo em text-strong), selected (cta-default, a nota escolhida) e outline (só a borda). */
  state?: 'default' | 'selected' | 'outline';
  /** on-inverse: sobre color-surface-inverse (faixa do crítico). */
  surface?: 'default' | 'on-inverse';
  /** Torna a nota clicável (botão com aria-pressed). */
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export interface GalleryImage { src: string; alt?: string; }

export interface ProductGalleryProps {
  images: GalleryImage[];
  /** Foto inicial (padrão 0). */
  defaultIndex?: number;
  /** 360 px, sem raio, com pontos no lugar das miniaturas. */
  mobile?: boolean;
  /** Compartilhar e favoritar sobre a foto (padrão true). */
  showActions?: boolean;
  showThumbnails?: boolean;
  showDots?: boolean;
  onShare?: () => void;
  onFavorite?: () => void;
  className?: string;
}

export interface BuyBarProps {
  /** Nome do produto (desktop). */
  name?: ReactNode;
  /** Foto do produto (desktop, 48 px). */
  image?: string;
  /** Props do Price small. No mobile, o selo de desconto sai. */
  price: PriceProps;
  quantity?: number;
  onQuantityChange?: (value: number) => void;
  /** Mostra o QuantitySelector (desktop, padrão true). */
  showQuantity?: boolean;
  /** Texto do Button cta large (padrão "Adicionar"). */
  actionLabel?: ReactNode;
  onAdd?: () => void;
  mobile?: boolean;
  /** Fixa a barra no rodapé da tela (position fixed). */
  fixed?: boolean;
  className?: string;
}

export interface TasteRow { label: string; /** 1 a 5. */ value: number; }

export interface TasteProfileProps {
  /** Só os atributos que o produto tem no cadastro (tinto: Fruta, Açúcar, Acidez, Tanino). */
  rows: TasteRow[];
  /** Padrão "Prove o vinho". */
  title?: ReactNode;
  showTitle?: boolean;
  className?: string;
}

export interface Critic { source: string; score: string; name: ReactNode; role?: ReactNode; text: ReactNode; }

export interface ExpertOpinionProps {
  /** sommelier: foto, nome, cargo e texto (Evino). critic: faixa escura com as notas e o texto do crítico escolhido (Grand Cru). */
  type?: 'sommelier' | 'critic';
  name?: ReactNode;
  role?: ReactNode;
  opinion?: ReactNode;
  /** URL da foto; sem ela, mostra as iniciais. */
  picture?: string;
  /** type critic: um item por crítico. */
  critics?: Critic[];
  /** Crítico inicial (padrão 0). */
  defaultIndex?: number;
  mobile?: boolean;
  className?: string;
}

export interface RelatedKitProps {
  /** Nome do kit. */
  name: ReactNode;
  /** Chamada acima do nome (padrão "Aproveite para conferir este kit!"). */
  eyebrow?: ReactNode;
  showEyebrow?: boolean;
  image?: string;
  imageAlt?: string;
  /** Props do Price small (de/por, desconto e preço por garrafa). */
  price?: PriceProps;
  href?: string;
  onClick?: () => void;
  /** 328 px. */
  mobile?: boolean;
  className?: string;
}

export declare function Price(props: PriceProps): React.JSX.Element;
export declare function Award(props: AwardProps): React.JSX.Element;
export declare function ProductGallery(props: ProductGalleryProps): React.JSX.Element;
export declare function BuyBar(props: BuyBarProps): React.JSX.Element;
export declare function TasteProfile(props: TasteProfileProps): React.JSX.Element;
export declare function ExpertOpinion(props: ExpertOpinionProps): React.JSX.Element;
export declare function RelatedKit(props: RelatedKitProps): React.JSX.Element;
