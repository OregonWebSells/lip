const backToHome = {
  extra: {
    classNames: ['backToHome', 'iconSmall'],
    icon: 'img/shared/arrow-left.svg',
  },
  href: '/overview',
  label: 'Home',
  type: 'link',
};

module.exports = {
  main: [
    {
      type: 'doc',
      id: 'overview',
      extra: {
        classNames: ['spacer'],
        icon: 'img/overview.svg',
        iconDark: 'img/overview-dark.svg',
      },
    },
    {
      label: 'LIPS',
      items: [
        {
          type: 'ref',
          id: 'all-lips',
          extra: {
            icon: 'img/all-lips.svg',
            iconDark: 'img/all-lips-dark.svg',
          },
        },
        {
          type: 'ref',
          id: 'standard-lips',
          extra: {
            icon: 'img/standard-lips.svg',
            iconDark: 'img/standard-lips-dark.svg',
          },
        },
        {
          type: 'ref',
          id: 'process-lips',
          extra: {
            icon: 'img/process-lips.svg',
            iconDark: 'img/process-lips-dark.svg',
          },
        },
        {
          type: 'ref',
          id: 'info-lips',
          extra: {
            icon: 'img/info-lips.svg',
            iconDark: 'img/info-lips-dark.svg',
          },
        },
      ],
      type: 'category',
    }
  ],
  allLips: [
    backToHome,
    {
      type: 'doc',
      id: 'all-lips',
      extra: {
        classNames: ['spacer'],
        icon: 'img/all-lips.svg',
        iconDark: 'img/all-lips-dark.svg',
      },
    },
  ],
  standardLips: [
    backToHome,
    {
      type: 'doc',
      id: 'standard-lips',
      extra: {
        classNames: ['spacer'],
        icon: 'img/standard-lips.svg',
        iconDark: 'img/standard-lips-dark.svg',
      },
    },
  ],
  infoLips: [
    backToHome,
    {
      type: 'doc',
      id: 'info-lips',
      extra: {
        classNames: ['spacer'],
        icon: 'img/info-lips.svg',
        iconDark: 'img/info-lips-dark.svg',
      },
    },
  ],
  processLips: [
    backToHome,
    {
      type: 'doc',
      id: 'process-lips',
      extra: {
        classNames: ['spacer'],
        icon: 'img/process-lips.svg',
        iconDark: 'img/process-lips-dark.svg',
      },
    },
  ]
};
