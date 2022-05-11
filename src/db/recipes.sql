create table recipe
(
    uuid          uuid      default gen_random_uuid() not null,
    name          text                                not null,
    created       timestamp default now()             not null,
    last_modified timestamp default now()             not null,
    constraint recipe_pk
        primary key (uuid),
    constraint recipe_name_check
        check (name <> ''::text)
);

alter table recipe
    owner to postgres;

create table ingredient
(
    uuid          uuid      default gen_random_uuid() not null,
    name          text                                not null,
    created       timestamp default now()             not null,
    last_modified timestamp default now()             not null,
    price         double precision,
    constraint ingredient_pk
        primary key (uuid),
    constraint ingredient_name_check
        check (name <> ''::text)
);

alter table ingredient
    owner to postgres;

create unique index ingredient_uuid_uindex
    on ingredient (uuid);

create table recipe_ingredient
(
    uuid       uuid default gen_random_uuid() not null,
    recipe     uuid                           not null,
    ingredient uuid                           not null,
    amount     text,
    constraint recipe_ingredient_pk
        primary key (uuid),
    constraint recipe
        foreign key (recipe) references recipe,
    constraint ingredient
        foreign key (ingredient) references ingredient
);

alter table recipe_ingredient
    owner to postgres;

