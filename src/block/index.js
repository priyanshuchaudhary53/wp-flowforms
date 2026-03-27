import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
  PanelBody,
  SelectControl,
  TextControl,
  Placeholder,
  Spinner,
  Notice,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

registerBlockType( metadata.name, {
  edit: Edit,
  save: () => null, // dynamic block — rendered by PHP
} );

function Edit( { attributes, setAttributes } ) {
  const { formId, height, borderRadius } = attributes;

  const blockProps = useBlockProps( {
    style: { width: '100%' },
  } );

  // Fetch all wpff_forms posts for the dropdown.
  const { forms, isLoading } = useSelect( ( select ) => {
    const query = { per_page: -1, status: 'publish', orderby: 'title', order: 'asc' };
    const posts = select( coreStore ).getEntityRecords( 'postType', 'wpff_forms', query );
    return {
      forms:     posts ?? [],
      isLoading: ! select( coreStore ).hasFinishedResolution(
        'getEntityRecords',
        [ 'postType', 'wpff_forms', query ]
      ),
    };
  }, [] );

  // Separately check the status of the currently selected form (may be trashed).
  const selectedPost = useSelect( ( select ) => {
    if ( ! formId ) return null;
    return select( coreStore ).getEntityRecord( 'postType', 'wpff_forms', formId ) ?? null;
  }, [ formId ] );

  const isTrashed    = !! ( selectedPost && selectedPost.status === 'trash' );
  const selectedForm = isTrashed ? null : ( forms.find( ( f ) => f.id === formId ) ?? null );

  const formOptions = [
    { label: __( '— Select a form —', 'wpflowforms' ), value: 0 },
    ...forms.map( ( f ) => ( { label: f.title?.rendered ?? `Form ${ f.id }`, value: f.id } ) ),
  ];

  return (
    <>
      { /* ── Inspector sidebar ───────────────────────────────────────── */ }
      <InspectorControls>
        <PanelBody title={ __( 'Form', 'wpflowforms' ) } initialOpen={ true }>
          { isLoading ? (
            <Spinner />
          ) : (
            <SelectControl
              label={ __( 'Select form', 'wpflowforms' ) }
              value={ formId }
              options={ formOptions }
              onChange={ ( val ) => setAttributes( { formId: Number( val ) } ) }
            />
          ) }
        </PanelBody>

        <PanelBody title={ __( 'Dimensions', 'wpflowforms' ) } initialOpen={ true }>
          <TextControl
            label={ __( 'Height', 'wpflowforms' ) }
            help={ __( 'Any valid CSS value — px, vh, em, etc.', 'wpflowforms' ) }
            value={ height }
            onChange={ ( val ) => setAttributes( { height: val } ) }
            placeholder="520px"
          />
          <TextControl
            label={ __( 'Border radius', 'wpflowforms' ) }
            help={ __( 'Any valid CSS value — px, %, em, etc.', 'wpflowforms' ) }
            value={ borderRadius }
            onChange={ ( val ) => setAttributes( { borderRadius: val } ) }
            placeholder="16px"
          />
        </PanelBody>
      </InspectorControls>

      { /* ── Canvas placeholder ───────────────────────────────────────── */ }
      <div { ...blockProps }>
        { ! formId ? (
          <Placeholder
            icon="feedback"
            label={ __( 'FlowForm', 'wpflowforms' ) }
            instructions={ __( 'Select a form from the sidebar to embed it here.', 'wpflowforms' ) }
          />
        ) : isTrashed ? (
          <TrashedFormWarning
            formId={ formId }
            formTitle={ selectedPost?.title?.rendered }
          />
        ) : (
          <FormPlaceholder
            form={ selectedForm }
            height={ height }
            borderRadius={ borderRadius }
          />
        ) }
      </div>
    </>
  );
}

function FormPlaceholder( { form, height, borderRadius } ) {
  const title = form?.title?.rendered ?? __( 'Loading…', 'wpflowforms' );

  return (
    <div
      style={ {
        width:           '100%',
        minHeight:       height,
        borderRadius:    borderRadius,
        background:      '#f7f4ef',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             '10px',
        border:          '2px dashed #d1cdc5',
        boxSizing:       'border-box',
        padding:         '32px 24px',
        fontFamily:      'inherit',
      } }
    >
      { /* FlowForms label */ }
      <span
        style={ {
          fontSize:      '0.7rem',
          fontWeight:    700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color:         '#a09890',
        } }
      >
        WPFlowForms
      </span>

      { /* Form title */ }
      <span
        style={ {
          fontSize:   '1.05rem',
          fontWeight: 600,
          color:      '#1f1a15',
        } }
      >
        { title }
      </span>

      { /* Hint */ }
      <span
        style={ {
          fontSize: '0.8rem',
          color:    '#a09890',
        } }
      >
        { __( 'Rendered on the frontend', 'wpflowforms' ) }
      </span>
    </div>
  );
}

function TrashedFormWarning( { formId, formTitle } ) {
  const label = formTitle || `Form #${ formId }`;
  const restoreUrl = `${ window.wpff?.adminUrl ?? '' }admin.php?page=wpff_forms&status=trash`;

  return (
    <Notice status="warning" isDismissible={ false }>
      <strong>{ label }</strong>
      { ' ' }
      { __( 'is in the Trash and will not be visible to visitors.', 'wpflowforms' ) }
      { ' ' }
      <a href={ restoreUrl } target="_blank" rel="noopener noreferrer">
        { __( 'Go to Trash to restore it →', 'wpflowforms' ) }
      </a>
    </Notice>
  );
}